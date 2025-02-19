import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteOnCloud, uploadOnCloud } from "../utils/cloudinary.js";

/*Video TODO: 
    #upload video by user on cloudinary
    #getvideo
    #delete video from cloudinary
*/
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    if (!userId) {
        throw new ApiError(401, "User Id is required!!");

    }
    const filter = { isPublished: true };
    console.log("User id in get all videos: ", userId);
    console.log(isValidObjectId(userId));

    if (isValidObjectId(userId)) {
        filter.owner = new mongoose.Types.ObjectId(userId)
    }
    let pipeline = [
        {
            $match: {
                $and: [
                    {
                        $or: [
                            { title: { $regex: query || "", $options: "i" } },
                            { description: { $regex: query || "", $options: "i" } }
                        ]
                    },
                    filter,
                ]
            }
        }
    ];
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === 'asc' ? 1 : -1
            }
        });
    }
    else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }
    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }
    const video = await Video.aggregatePaginate(Video.aggregate(pipeline), options);
    console.log("Video:", video);

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Videos Fetched Successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if ([title, description].some((field) => field.trim() === "")) {
        throw new ApiError(400, "Title and Description are necessary");

    }

    const videoFilePath = req.files?.videoFile[0]?.path;

    const thumbnailPath = req.files?.thumbnail[0].path;
    console.log("Video file path: ", videoFilePath);

    if (!videoFilePath) {
        throw new ApiError(401, "Video File is necessary");
    }
    if (!thumbnailPath) {
        throw new ApiError(400, "Thumbnail File is necessary");

    }
    const videoFile = await uploadOnCloud(videoFilePath);
    const thumbnail = await uploadOnCloud(thumbnailPath);

    console.log("Video file:", req.files.videoFile);
    console.log("Thumbnail file:", thumbnail);
    if (!videoFile) {
        throw new ApiError(401, "Video File not found");
    }
    if (!thumbnail) {
        throw new ApiError(401, "Thumbnail file not found");

    }
    const video = await Video.create({
        thumbnail: thumbnail?.url || "",
        videoFile: videoFile?.url || "",
        title,
        description,
        duration: videoFile.duration,
        isPublished: false,
        owner: req.user?._id
    });
    const videoCreated = await Video.findById(video._id)
    if (!videoCreated) {
        throw new ApiError(500, "Video Upload failed try again!!");

    }
    return res
        .status(200)
        .json(new ApiResponse(200, videoCreated, "Video Uploaded Successfully "))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }
    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalid userId");
    }

    //TODO: get video by id
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscriberCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            subscriberCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                },
                ownercheck: "$owner",
                owner: {
                    $first: "$owner"
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                videoFile: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                isLiked: 1,
                likesCount: 1,
                ownercheck: 1,
                owner: 1
            }
        }
    ]);
    const owner = await User.findById("67accfb76c498a2a8885c540")
    console.log("Owner by videoid: ", owner);

    console.log("Video seen to user is1: ", video);
    console.log("Video seen to user is2: ", video[0]);


    if (!video) {
        throw new Error(500, "Video Not fetched successfully");

    }

    console.log("Views of video: ", video[0].views);
    const user = await User.findById(req.user._id);
    const hasWathced = user.watchHistory.includes(videoId);
    console.log("has watched:", hasWathced);

    if (!hasWathced) {
        await Video.findByIdAndUpdate(videoId,
            { $inc: { views: 1 } }
        );
    }

    console.log("history: ", req.user.watchHistory);

    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: { watchHistory: videoId }
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "Video Fetched Successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body;
    if (!title || !description) {
        throw new ApiError(401, "Field are necessary");
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "User Not Found");
    }

    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "Only Video Owner can update the Video details!!!");

    }

    const thumbnailPath = req.file?.path;
    if (!thumbnailPath) {
        throw new ApiError(400, "File Necessary");

    }

    const thumbnail = await uploadOnCloud(thumbnailPath);
    if (!thumbnail) {
        throw new ApiError(401, "File Not found");
    }
    console.log("new thumbnail file: ", thumbnail);

    const oldthumbnailFilePath = video?.thumbnail;
    console.log("old thumbnail: ", video.thumbnail);

    const deleteCloudthumbnail = await deleteOnCloud(oldthumbnailFilePath);
    console.log("Delete Old video File: ", deleteCloudthumbnail);

    const updatedVideoDetails = await Video.findByIdAndUpdate(
        video,
        { $set: { title, description, thumbnail: thumbnail?.url } },
        { new: true }
    );
    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideoDetails, "Video Updated Successfully"))

});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(401, "Invalid Video Id");

    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(401, "Video not found");
    }
    if (video.owner.toString() !== req.user?.id.toString()) {
        throw new ApiError(401, "Only Video Owner Deletes the video!!!!");

    }
    const deleteVideoFilePath = video?.videoFile;
    if (!deleteVideoFilePath) {
        throw new Error(400, "Video File Necessary");

    }
    const deleteVideoCloudinaryFile = await deleteOnCloud(deleteVideoFilePath);
    console.log("Deleted Video: ", deleteVideoCloudinaryFile);
    const deletedVideo = await Video.findByIdAndUpdate(
        video?._id,
        { $unset: { videoFile: 1 } },
        { new: true }
    )
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video Deleted Successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Video Id");

    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video Not Found");
    }
    // if (video.owner.toString() !== req.user?._id.toString()) {
    //     throw new ApiError(401, "Only Owner can toggle");
    // }

    console.log("vidoe :  ", video);

    const toggledPublishedVideo = await Video.findByIdAndUpdate(video?._id,
        { $set: { isPublished: !video?.isPublished } },
        { new: true }
    )
    if (!toggledPublishedVideo) {
        throw new ApiError(500, "Failed to toogle video publish status");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, {isPublished: toggledPublishedVideo.isPublished}, "IsPublished toggled successfully"))

})

export { getAllVideos, publishAVideo, getVideoById, updateVideo, deleteVideo, togglePublishStatus }