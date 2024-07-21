import { v2 as cloudinary } from 'cloudinary';
import fs from "fs" //file system

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async(localFilePath)=>{
    // console.log("localFilePath::",localFilePath);
    try {
        if(!localFilePath)return null //if file is not correct 

        //upload the file on cloudinary 
        // console.log("/////////////1 2 2 3 4 4 5 6 6  6"); error occured therefore checking by log
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })

        
        
        //file has been uploaded successfull
        console.log("file is uploaded on cloudinary",response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        console.log("123wsdfghyt65r4ew2345rtgfvc");
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary}