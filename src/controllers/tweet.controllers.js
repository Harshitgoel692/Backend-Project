import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweets.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    if(!content){
        throw new ApiError(400, "Content field is necessary");   
    }
    const tweet = await Tweet.create(
        {content,
        owner: new mongoose.Types.ObjectId(req.user?._id)}
    );
    if(!tweet){
        throw new ApiError(500, "Error; Tweet not created");   
    }
    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet Created Successfully"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User Id");
    }
    const tweet = await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes",
                pipeline:[
                    {
                        $project:{
                            likedBy: 1
                        }
                    }
                ]
            }
        },
        {
            $addfields:{
                likesCount:{
                    $size: "$likes"
                },
                ownerDetails:{
                    $first: "$owner"
                },
                isLiked:{
                    $cond:{
                        if: {$in:[req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $project:{
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            }
        }
    ]);
    if(!tweet){
        throw new ApiError(404, "Error while creating the tweet");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet Created successfuly"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const {content} = req.body;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet Id");
    }
    if(!content){
        throw new ApiError(400, "Content field is necessary");
    }
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(401, "Tweet not found");
    }
    if(tweet?.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(401, "Only owner update the tweet");
    }
    await Tweet.findByIdAndUpdate(
        tweet?._id,
        {
            $set: {
                content
            }
        },
        {new: true}
    )
    if (!tweet) {
        throw new ApiError(500, "Failed to edit tweet please try again");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId");
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can delete thier tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(new ApiResponse(200, {tweetId}, "Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}