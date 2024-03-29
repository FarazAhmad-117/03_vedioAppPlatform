import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteLocalFile } from "../utils/deleteLocalFile.js";
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async(userId)=>{
    try{
        const user =await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken};
    }catch(error){
        throw new ApiError(500, "Something went wrong while generating referesh and access token");
    }
}


export const registerUser = asyncHandler( async(req,res)=>{
    // get details from front end
    // validation for empty
    // validation for correctness of email,phone no, etc
    // check if user already exists
    // upload image to storage
    // get url from image and send it into db
    // remove password and refresh token from db response
    // check for user creation
    // return response

    const {username,email,password,fullName} = req.body;
    if(
        [username,email,password,fullName].some(field=>field?.trim() === "") || !username || !email || !password || !fullName 
    ){
        throw new ApiError(400,"All fields are required!");
    }
    const existedUser = await User.findOne({
        $or: [{email},{username}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists!");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLoacalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLoacalPath);
    if(!avatar){
        deleteLocalFile(avatarLocalPath);
        deleteLocalFile(coverImageLoacalPath);
        if(coverImage){
            deleteFromCloudinary(coverImage.public_id);
        }
        throw new ApiError(400,"Avatar file is Could not be uploaded");
    }
    // If uploaded delete images in our local space
    deleteLocalFile(avatarLocalPath);
    deleteLocalFile(coverImageLoacalPath);

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar:avatar.url,
        avatarId:avatar.public_id,
        coverImage:coverImage?.url || "",
        coverImageId:coverImage.public_id || "",
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500,'Something went wrong while registering the user.')
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registerd Successfuly")
    );
});



// Login Function

export const login = asyncHandler(async(req,res)=>{
    const {email,username,password} = req.body;
    if(!(email || username)){
        console.log(req.body);
        throw new ApiError(400,"Username or Email must be provided");
    }
    const user = await User.findOne({
        $or:[{email},{username}]
    });
    if(!user){
        throw new ApiError(404,"User does not exists");
    }
    const isUserValid =await user.isPasswordCorrect(password);
    if(!isUserValid){
        throw new ApiError(401,"Invalid User Credentials");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    const options = {
        httpOnly:true,
        secure:true
    }
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    res.status(200)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,
                accessToken,
                refreshToken,
            },
            "User Successfully Logged In"
        )
    )
});

// Logout

export const logout = asyncHandler(async(req,res)=>{
    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{  // update operations o be performed - here its unset means remove a filed from document
                refreshToken:1 // here 1 is just a placeholder and refresh is meant to be removed
            }
        },
        {
            new:true // means to return the new document after updation not the one before updating
        }
    )
    const options = {
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})

// Controller to refresh accessToken

export const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incommingRefreshToken = req.cookie?.refreshToken || req.body.refreshToken;
    if(!incommingRefreshToken) {
        throw new ApiError(401,"Unauthorized request");
    }
    // If token available;
    const decodedToken = jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    const user =await User.findById(decodedToken?._id).select("-password");
    if(!user){
        throw new ApiError(401,"Invalid refresh token");
    }
    if(incommingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired or used");
    }
    const {accessToken,refreshToken} =await generateAccessAndRefreshToken(user._id);
    const options = {
        httpOnly:true,
        secure:true
    }
    res.status(200)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                accessToken,
                refreshToken
            },
            "Access Token Updated Successfully"
        )
    );
})

// Change current password:
export const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    const user =await User.findById(req.user?._id);
    const isCorrect =await user.isPasswordCorrect(oldPassword);
    if(!isCorrect){
        throw new ApiError(400,'Invalid old Password');
    }
    user.password = newPassword;
    const updatedUser = await user.save({validateBeforeSave:false});
    if(!updatedUser){
        throw new ApiError(500,'Error Saving the password');
    }
    res.status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Password Updated Sucessfully"
        )
    );
})


export const getUser = asyncHandler(async(req,res)=>{
    res.status(200)
    .json(new ApiResponse(200,{
        user:req.user
    },"User Data Found"));
})


// Function to update Account Details
export const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body;
    const user =await User.findOneAndUpdate(req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken");
    if(!user){
        throw new ApiError(404,"User Not Found");
    }
    res.status(200)
    .json(new ApiResponse(
        200,
        user,
        "Details Updated Successfully"
    ));
})

// Updating files
export const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.files?.avatar[0]?.path; // file not files because just taking a single file
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar){
        throw new ApiError(500,"Avatar file could not be uploaded");
    }
    deleteLocalFile(avatarLocalPath);
    const oldImgId = req.user?.avatarId;
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url,
                avatarId:avatar.public_id
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken");
    await deleteFromCloudinary(oldImgId);
        
    if(!updatedUser){
        throw new ApiError(500,"Could not update User");
    }
    res
    .status(200)
    .json(new ApiResponse(200,{user:updatedUser},"Avatar Updated Successfully"));
})




// Updating files
export const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.files?.coverImage[0]?.path; // file not files because just taking a single file
    if(!coverImageLocalPath){
        throw new ApiError(400,"Avatar file required");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage){
        throw new ApiError(500,"Avatar file could not be uploaded");
    }
    deleteLocalFile(coverImageLocalPath);
    const oldImgId = req.user?.coverImageId;
    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url,
                coverImageId:coverImage.public_id
            }
        },
        {
            new:true
        }
    ).select("-password -refreshToken");
    await deleteFromCloudinary(oldImgId);

    if(!updatedUser){
        throw new ApiError(500,"Could not update User");
    }
    res
    .status(200)
    .json(new ApiResponse(200,{user:updatedUser},"Avatar Updated Successfully"));
})


// Each User must have a channel and also a count for subscribers and subscriptions
// I am going to take these details from subscription collection and then perform agregation pipeline
// to get details of channel

export const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const { username } = req.params;
    if(!username?.trim()){
        throw new ApiError(400,"Username is missing");
    }
    const channel = await User.aggregate([
        // First pipeline
        {
            $match:{          // This must be the the username of the channel some user is looking at
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{        // We are looking for the subscribers of that channel
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{       // We are looking fro the subscribes by that channel
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{      // Now we are adding the data fields in to the Channel Details
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{             // Checking if the user looking for that channel is a subscriber or not
                        if:{$in: [req.user?._id, "$subscribers.subscribe"]}, // checks if first one is present in second
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{ // Telling them which fields are we going to add
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
                createdAt:1
            }
        }
    ]);

    if(!channel){
        throw new ApiError(404,"Channel Does Not Exists");
    }

    res
    .status(200)
    .json(new ApiResponse(
        200,
        channel[0],
        "User Fetched Successfully"
    ));
})










