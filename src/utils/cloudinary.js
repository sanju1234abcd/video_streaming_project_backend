import {v2} from "cloudinary";
import fs from "fs" //fs = file system (use for file operations)

v2.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret :process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async(localFilePath)=>{
    try{
        if(!localFilePath) return null;

        //upload file on cloudinary
        const response = await v2.uploader.upload(localFilePath,{
            resource_type  : "auto"
        })
        console.log("File has been uploaded successfully ->url->",response.url);
        fs.unlinkSync(localFilePath)
        return response
    }
    catch(error){
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation has failed
        return null;
    }
}

const deleteFromCloudinary = async(thumbnail_public_id,videoFile_public_id)=>{
    console.log(thumbnail_public_id)
    const thumbnail_response = await v2.uploader.destroy(thumbnail_public_id)
    console.log(thumbnail_response)
    console.log(videoFile_public_id)
    const videoFile_response = await v2.uploader.destroy(videoFile_public_id)
    console.log(videoFile_response)
}

export {uploadOnCloudinary , deleteFromCloudinary}