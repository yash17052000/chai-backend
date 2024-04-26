import { asynchandler} from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser=asynchandler(async (req,res)=>{
    // res.status(200).json({
    //     message:"chai aur code"
    // })

    /// get user details from frontend
    // validation - not empty 
    // check if usetr exists :username,email
    //check for images ,check for avatr
    // upload them  to cloudinary ,avatar 
    // create user object -- create entry in db
    // remove password anf refresh token field from response 
    //chck for user creation 
    //return response


    /// get user details from frontend
const {fullName,email,username,password}=req.body
    console.log("request of body is ....",req.body);


     // validation - not empty 
    if ([fullName,email,username,password].some((field)=>field?.trim()==="")) {
        throw new ApiError(400,"All fields are required")
    }
    
    // check if usetr exists :username,email

    // if we want more value then we jhave to use "$or" 
const existedUser =await User.findOne({
  $or:[{username},{email}]
 })
if (existedUser) {
    throw new ApiError(409,"User with email or userName already exists  ")
 }



 //check for images ,check for avatr

 console.log("requtes files of coverimage and avatar",req.files);

 const avatarLocalPath=req.files?.avatar[0]?.path
 //const coverImageLocalPath = req.files?.coverImage[0]?.path;

 let coverImageLocalPath;
 if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
     coverImageLocalPath = req.files.coverImage[0].path
 }
 if(!avatarLocalPath)
 {
    throw new ApiError(400,"Avatar file is required")
 }



  ///upload them  to cloudinary ,avatar 

const avatar=await uploadOnCloudinary(avatarLocalPath)
const coverImage=await uploadOnCloudinary(coverImageLocalPath)

if(!avatar)
 {
    throw new ApiError(400,"Avatar file is required")
 }


  // create user object -- create entry in db

// database hmara dusra continent ma hoga and error hona k chcnaces h bhut isma el asynchiandler h to main tain error and
// apply await  keyword befire the method 
const user=await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
})
 //chck for user creation 

// we have many methods to do this so better many like this is given here 
// database generate id by default with each entry 
//remove password anf refresh token field from response  using select method
const CreatedUser=await  User.findById(user._id).select(
    "-password -refreshToken"

)

if(!CreatedUser)
{
    throw new ApiError(500,"something went wrong while regitering the user")
}
// return response

return res.status(201).json(
    new   ApiResponse(  200,CreatedUser,"user regsitered sucessfully")
)
})

   


export { registerUser}