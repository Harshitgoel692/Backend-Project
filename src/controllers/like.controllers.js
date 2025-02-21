import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/likes.models.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");
    }
    const videoLiked = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    });
    if (videoLiked) {
        const unlike = await Like.findByIdAndDelete(videoLiked?._id);
        return res
            .status(200)
            .json(new ApiResponse(200, unlike, "Like Removed"))
    }

    const like = await Like.create({
        video: videoId,
        likedBy: req.user?.id
    })

    return res
        .status(200)
        .json(new ApiResponse(200, like, "Like added"))


});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!commentId) {
        throw new ApiError(400, "Invalid Comment ID");

    }

    const likedComment = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (likedComment) {
        const unlike = await Like.findByIdAndDelete(likedComment?._id);
        return res.status(200).json(new ApiResponse(200, unlike, "Like removed"))
    }
    const like = await Like.create({
        likedBy: req.user?._id,
        comment: commentId
    })
    return res.status(200).json(new ApiResponse(200, like, "Like added"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!tweetId) {
        throw new ApiError(400, "Invalid Tweet Id");

    }
    const likedTweet = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })
    if (likedTweet) {
        const unlike = await Like.findByIdAndDelete(likedTweet?._id)
        return res.status(200).json(new ApiResponse(200, unlike, "Like removed"))
    }
    const like = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })
    return res.status(200).json(new ApiResponse(200, like, "Like added"))
}
)
const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const videoLiked = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        },
                    },
                    {
                        $unwind: "$owner"
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideos"
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $project:{
                _id:0,
                likedVideos:{
                    _id: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    duration: 1,
                    views: 1,
                    title: 1,
                    description: 1,
                    createdAt: 1 ,
                    isPublished:1
                },
                owner:{
                    username:1,
                    avatar:1,
                }
            }
        }
    ]);
    if(!videoLiked){
        throw new ApiError(400, "Liked Videos Not found");
        
    }
    return res.status(200).json(new ApiResponse(200, videoLiked, "Liked Videos Fetched Successfully"))
})

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos}