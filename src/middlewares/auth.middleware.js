import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

export const validToken = asyncHandler(async(req, _, next)=>{
    try {
        const token= await req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        console.log("token: ",token);//check
        
        if(!token){
            throw new ApiError(401, "Invalid Authorization");
        }
        
        const decodeToken= jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);        
        const user= await User.findById(decodeToken._id).select("-password -refreshToken");
        if(!user){
            throw new ApiError(401, "Invalid Access Token");
        }
        req.user=user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
        
    }

}) 