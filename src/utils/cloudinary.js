import {v2 as cloudinary} from 'cloudinary'
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.CLOUD_API_KEY, 
    api_secret: process.env.CLOUD_API_SECRET 
});

export const uploadOnCloudinary = async (localFilePath) =>{
    try {
        if(!localFilePath){
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto",
        })
        // file has been uploaded successfully
        console.log('File has been uploaded successfully',response);
        return response;
    } catch (error) {
        // fs.unlinkSync(localFilePath);
        console.error("Error uploading file",error);
        return null;
    }
}


export const deleteFromCloudinary = async (fileId)=>{
    try{
        const res = await cloudinary.uploader.destroy(fileId);        
        return res;
    }catch(error){
        console.error("Error deleting file",error);
        return null;
    }
}


