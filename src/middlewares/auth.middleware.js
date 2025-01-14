import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models";

export const validToken = asyncHandler(async(req, _, next)=>{
    try {
        const token= await req.cookies?.accessToken || req.header("Authenticate")?.replace("Bearer ", "");
        console.log(token);//check
        
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
        throw new Error(401, error?.message || "Invalid Access Token");
        
    }

}) 