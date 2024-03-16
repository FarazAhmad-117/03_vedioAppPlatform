import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteLocalFile } from "../utils/deleteLocalFile.js";

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
        avatar:avatar.secure_url,
        coverImage:coverImage?.secure_url || "",
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











