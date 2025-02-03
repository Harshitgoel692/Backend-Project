import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";

    // Configuration
    cloudinary.config({ 
        cloud_name: `${process.env.CLUODINARY_CLOUD_NAME}`, 
        api_key: `${process.env.CLOUDINARY_API_KEY}`, 
        api_secret: `${process.env.CLOUDINARY_API_SECRET}` 
    });

    const uploadOnCloud= async (localFilePath)=>{
        try {
            if (!localFilePath) return null;
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
            // console.log("File uploaded on cloudinary", response.url);
            fs.unlinkSync(localFilePath)
            return response
        } catch (error) {
            fs.unlinkSync(localFilePath);
            return null;
        }
    }

    const deleteOnCloud= async (oldFileToBeDeleted) => {
        try {
            if(!oldFileToBeDeleted) return null;
            const public_id=oldFileToBeDeleted.split('/').pop().split('.')[0];
            console.log("public_id:",public_id);
            const response = await cloudinary.uploader.destroy(public_id );
            if(response.result==="ok" || response.result==="not found"){
                return response;
            }else{
                throw new ApiError(500, "Failed to delete file from cloudinary");
            }
        } catch (error) {
            throw new ApiError(500, error?.message || "Server error during file deletion");
        }   
        
    }

    export {uploadOnCloud, deleteOnCloud};