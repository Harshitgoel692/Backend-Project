import mongoose, {isValidObjectId} from "mongoose"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id");
    }
    if(channelId.toString()===req.user?._id.toString()){
        throw new ApiError(401, "User cannot toggle its own channel");
        
    }
    // TODO: toggle subscription
    const subscribedChannel = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id
    });
    if(subscribedChannel){
        const unsubscribe = await Subscription.findByIdAndDelete(subscribedChannel?._id);
        return res
        .status(200)
        .json(new ApiResponse(200, unsubscribe, "Channel Unsubscribed Successfully"))
    }
    const subscribe = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId
    });
    return res
    .status(200)
    .json(new ApiResponse(200, subscribe, "Channel Subscribed Successfully")) 

    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id");
    }
    const channelSubscribers = await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group:{
                _id: channelId,
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
    console.log("Channel subscribers are: ", channelSubscribers);
    
    return res
    .status(200)
    .json(new ApiResponse(200, channelSubscribers[0], "Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Id");
    }
    const channelsSubscribed = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as:"subscribedChannels"
            }
        },
        {
            $unwind: "$subscribedChannels"
        },
        {
            $project:{
                _id: 0,
                subscribedChannels:{
                    username: 1,
                    avatar: 1,
                }
            }
        }
    ]);
    console.log("Channels subscriber by User: ", req.user?.fullname);
    console.log(" Subscribed channels are: ", channelsSubscribed);
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channelsSubscribed,
                "subscribed channels fetched successfully"
            )
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}