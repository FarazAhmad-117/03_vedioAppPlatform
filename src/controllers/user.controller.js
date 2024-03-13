import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
        console.log('I was ran');
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
        throw new ApiError(400,"Avatar file is Could not be uploaded");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        password
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500,'Something ent wrong while registering the user.')
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registerd Successfuly")
    );
});



// Login Function



// Logout











