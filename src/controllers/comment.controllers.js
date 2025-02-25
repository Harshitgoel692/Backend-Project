import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comments.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { Like } from "../models/likes.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id");
        
    }
    const video = await Video.findById(videoId)
    const videoComment = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size: "$likes"
                },
                owner:{
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
                createdAt: 1,
                likesCount: 1,
                isLiked: 1,
                owner:{
                    username: 1,
                    avatar: 1
                }
            }
        }
    ]);
    const options = {
        page: parseInt(page,10),
        limit: parseInt(limit, 10)
    };
    const comments = await Comment.aggregatePaginate(videoComment, options);
    return res.status(200).json(new ApiResponse(200, comments, "Comments Fetched Successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const videoId= req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id");
        
    }
    const {content} = req.body;
    if(!content){
        throw new ApiError(400, "Comment content is necessary");
        
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(401, "Video not Found");
        
    }
    const commentAdded = await Comment.create(
        {
            video: videoId,
            content,
            owner: req.user?._id
        }
    )
    if (!commentAdded) {
        throw new ApiError(500, "Failed to add comment please try again");
    }
    return res
    .status(200)
    .json(new ApiResponse(200,commentAdded, "Comment Added"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const commentId = req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id");
        
    }
    const {content} = req.body;
    if(!content){
        throw new ApiError(400, "Comment content is necessary");
        
    }
    const comment = await Comment.findBy(commentId);
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }
    if(comment.owner?.toString()!== req.user?._id.toString()){
        throw new ApiError(401, "Only Owner update the comment");
        
    }
    const updatedComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set:{
                content
            }
        },
        {new: true}
    );
    if(!updatedComment){
        throw new ApiError(500, "Comment Not able to updated");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated Successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const commentId = req.params;
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment Id");
        
    }
    
    const comment = await Comment.findBy(commentId);
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }
    if(comment.owner?.toString()!== req.user?._id.toString()){
        throw new ApiError(401, "Only Owner delete the comment");
        
    }
    const deletedComment = await Comment.findByIdAndDelete(comment?._id);
    if(!deletedComment){
        throw new ApiError(500, "Comment Not able to deleted");
    }
    await Like.deleteMany(
        {comment: commentId,
        owner: req.user?._id}
    )
    return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted Successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }