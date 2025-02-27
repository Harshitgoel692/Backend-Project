import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/likes.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const videos = await Video.aggregate([{
        $match:{
          owner:new mongoose.Types.ObjectId(req.user?._id)
        }
      },
      {
        $lookup:{
            from : "likes",
            localField:"_id",
            foreignField:"video",
            as:"likes"
        }
       },
       {
        $addFields:{
            totalLikes:{
                $size:"$likes"
            }
        }
       },
       {
         $group: {
          _id: req.user?._id,
          totalViews:{
            $sum:"$views"
          },
          totalVideos: {
            $sum: 1
          },
          totalLikes:{
            $sum:"$totalLikes"
          },
           owner:{
             $push:"$owner"
           }
        }
       },
       {
         $lookup: {
           from: "users",
           localField: "owner",
           foreignField: "_id",
           as: "owner"
         }
       },
       {
         $project: {
           _id:0,
           totalVideos:1,
           totalViews:1,
           totalLikes:1,
           owner:{
             username:1,
             avatar:1
           }
         }
       }
      ]);
      console.log("User total videos are: ", videos[0]);

      if(!videos){
        throw new ApiError(400, "Not able to fetch total videos");
      }

      const totalSubscribers = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group:{
                _id: req.user?._id,
                totalSubscribers:{$sum: 1},
                subscribers:{$push: "$subscriber"}
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscribers",
                foreignField:"_id",
                as:"channelSubscribers"
            }
        },
        {
            $project:{
                _id:0,
                totalSubscribers:1,
                channelSubscribers:{
                    username:1,
                    avatar:1
                }
            }
        }
    ]);
    if(!totalSubscribers){
        throw new ApiError(400, "Not able to fetch total subscribers"); 
    }
    console.log("Total subscribers are: ", totalSubscribers);
    const channeStats = 
    {
      totalViews:videos[0].totalViews, 
      totalVideos:videos[0].totalVideos, 
      totalLikes:videos[0].totalLikes, 
      totalSubscribers:totalSubscribers[0].totalSubscribers, 
      ChannelSubscribers:totalSubscribers[0].channelSubscribers
    }
    return res
    .status(200)
    .json(new ApiResponse(200, channeStats, "Channel status Fetched successfully"))
      
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const uploadedVideos = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
        $project:{
            _id:0,
            videoFile:1,
            thumbnail:1,
            views:1,
            createdAt:1,
            title:1,
            duration:1,
            owner:1
        }}
        
    ]);
    if(!uploadedVideos){
        throw new ApiError(404,"Channel videos not found!!");   
    }
    return res
    .status(200)
    .json(new ApiResponse(200,uploadedVideos, "Channel all videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }