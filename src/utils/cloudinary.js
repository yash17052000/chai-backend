import { v2 as cloudinary } from "cloudinary";
import fs from "fs"


          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinay= async function (loacalFilePath) {
    try {
        if(!loacalFilePath)return null;
        ///upload the file on cloudinary 
   const response=   await  cloudinary.uploader.upload(loacalFilePath,{
            resource_type:"auto"
        })
        console.log(response.url);
        // file has been uploaded sucessfully 

        console.log("File has been upload sucessfully",response.url);
        return response// we are returning to user
    } catch (error) {
        // now we know that the file has come on server as we have got localfilepath
        // now we will remove this file from our server if file has not uploaded on our server
        fs.unlinkSync(loacalFilePath)/// remove the   locally  save temporary file  as the upload operation got failed
        return null
    }
}

export {uploadOnCloudinay}