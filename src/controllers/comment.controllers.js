import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comments.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { Like } from "../models/likes.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");

    }
    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentOwner",
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "commentLikeOwner",
            },
        },
        {
            $addFields: {
                totalCommentLikes: {
                    $size: "$commentLikeOwner",
                },
                commentOwner: {
                    $first: "$commentOwner"
                },

                isCommentLiked: {
                    $cond: {
                        if: {
                            $in: [
                                new mongoose.Types.ObjectId(req.user?._id),
                                "$commentLikeOwner.likedBy",
                            ],
                        },
                        then: true,
                        else: false,
                    },
                },
                commentLikeOwner: {
                    $first: "$commentLikeOwner"
                },
            },
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 0,
                content: 1,
                commentOwner: {
                    username: 1,
                    avatar: 1
                },
                commentLikeOwner: {
                    likedBy:1
                },
                totalCommentLikes: 1,
                isCommentLiked: 1,
                createdAt: 1
            }
        }
    ];


    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };
    const videoComments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);
    console.log("Comments on video: ", videoComments);

    return res.status(200).json(new ApiResponse(200, videoComments, "Comments Fetched Successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");

    }
    if (!content) {
        throw new ApiError(400, "Comment content is necessary");

    }
    const video = await Video.findById(videoId);
    if (!video) {
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
    console.log("Added comment is: ", commentAdded);

    return res
        .status(200)
        .json(new ApiResponse(200, commentAdded, "Comment Added"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");

    }
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Comment content is necessary");

    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if (comment.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "Only Owner update the comment");

    }
    const updatedComment = await Comment.findByIdAndUpdate(
        comment?._id,
        {
            $set: {
                content
            }
        },
        { new: true }
    );
    if (!updatedComment) {
        throw new ApiError(500, "Comment Not able to updated");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated Successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id");

    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }
    if (comment.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "Only Owner delete the comment");

    }
    const deletedComment = await Comment.findByIdAndDelete(comment?._id);
    if (!deletedComment) {
        throw new ApiError(500, "Comment Not able to deleted");
    }
    await Like.deleteMany(
        {
            comment: commentId,
            owner: req.user?._id
        }
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