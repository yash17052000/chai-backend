import { asynchandler} from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessandRefreshTokens=async (userId)=>{
    try {
      const user=  await User.findById(userId)
     const accessToken= user.generateAccessToken()
    const refreshToken=  user.generateRefreshToken()
      user.refreshToken=refreshToken// it has store refreshtoken in datatbase
      await user.save({validateBeforeSave:false})
      return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something wnet wrong while generating refresh and acess tojen")
    }
}
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

const loginUser=   asynchandler(async(req,res)=>{

//req body --> data 
//username or email
//find the user
// passoword check
// acess and refresh token generate 
//send them in cookies 
//send the res

const {email,username,password}= req.body 



if (!username && !email) {
    throw new ApiError(400, "username or email is required")
}
// this is dcused un video
// if(!(username||email))// correting this error 
// throw new ApiError(400,"username or email is required")

const user = await User.findOne({// findone sa jo bhi database ma entry wo mil jaaegi huma
    $or:[{username},{email}]// check in database it will return according to it
})

if(!user){
throw new ApiError(404,"user not exist...")
}
//User sa hum mongodb k methods ko acesss kr skta hein
const isPassowordValid=await user.isPasswordCorrect(password)

if(!isPassowordValid)
throw new ApiError(401,"Invalid user credentialss")
const {accessToken,refreshToken}=await generateAccessandRefreshTokens(user._id)

const loggedInUser=await User.findById(user._id).select("-password  -refreshToken")/// jo cheez huma nhi chaa usee mana kr do 



// by using below one anyone can modify the cokkies in frontend,but by httponly true and secure : true ya kvl server sa modify hongi
const options={
    httpOnly:true,
    secure:true
}
// console.log(loggedInUser);
console.log("User loggen in sucessfully");

return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(
        200,
        {
            user:loggedInUser,accessToken,
            refreshToken
        },
        "user loggend in scuessfully"
    )
)


})

const logoutUser=asynchandler(async(req,res)=>{


    // cookies clear
    //reset refeeshtoken

  // here we cannot use  "User.findById" as we cant put email while loggout due to this koi bhi frr logout kr dega
  // so here comes concept of middleware8


await User.findByIdAndUpdate(
    req.user._id,
    {
        $unset:{
            refreshToken:1
        }
    },
    {
    new :true
    }
)
console.log("User loggot out");
const options={
    httpOnly:true,
    secure:true
}
return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options)
.json(new ApiResponse(200,{},"User logged out"))
})
// refreshacesstoken endpoint
const refreshAccessToken=asynchandler(async(req,res)=>{
const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken
if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorised request")
   
}
try {
    const  decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    const user=await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401,"Invalid refresh token")
       
    }
    if(incomingRefreshToken!==user?.refreshToken)
    throw new ApiError(401,"refersh token is expired or used ")
    const options={
        httpOnly:true,
        secure:true
    }
    const {accessToken,newrefreshToken}=await generateAccessandRefreshTokens(user._id)
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options).
    json(new ApiResponse(
        200,
        {
            accessToken,refreshToken:newrefreshToken
        },"Acess Token rrfereshed"
    ))
    
} catch (error) {
    throw new ApiError(401,error?.message||"inavlid refresh toekn")
}})
const changeCurrentPassword = asynchandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})
const getCurrentUser = asynchandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})
const updateAccountDetails = asynchandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});
const updateUserAvatar = asynchandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asynchandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile=asynchandler(async(req,res)=>{
            const {username}=req.params
            if(!username?.trim())
                {
                     throw new ApiError(400,"username is missing")
                  }
const channel=await User.aggregate([
    {

    $match:{
    username:username?.toLowerCase()
    }
      },
      {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",// total number of subscriber of channel
        as:"subscribers"

      }
      },
      {
        $lookup:{
          from:"subscriptions",
          localField:"_id",// total subscribed by me
          foreignField:"subscriber",
          as:"subscribedTo"
  
        }
        }
        ,
        {
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelsubscribedToCount:{
                    $size:"$subscribedTo"
                },
                issubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
])
if (!channel?.length) {
    throw new ApiError(404, "channel does not exists")
}
return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})
const getWatchHistory = asynchandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


export { registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
updateAccountDetails,
updateUserAvatar,
updateUserCoverImage,
getUserChannelProfile,
getWatchHistory
}