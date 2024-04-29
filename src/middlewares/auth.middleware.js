import { ApiError } from "../utils/ApiError.js";

import jwt from "jsonwebtoken"

import { asynchandler } from "../utils/asynchandler.js";
import { User } from "../models/user.models.js";
// jb res khaali ho "_ " lga do uski jgh
export const verifyJWT = asynchandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // console.log(token);
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            //neext_video :dsiscussion about frontend
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})