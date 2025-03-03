import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name || !description){
        throw new ApiError(400, "Name and Description both are necessary");    
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })
    if(!playlist){
        throw new ApiError(500, "Error in creating the playlist");
        
    }
    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "PlayList created Successfully"))
    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User Id");
        
    }
    const playlist= await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "playlistVideos"
            }
        },
        {
            $addFields:{
                totalVideos:{
                    $size: "$playlistVideos"
                },
                totalViews:{
                    $sum: "$playlistVideos.views"
                }
            }
        },
        {
            $project:{
                _id: 1,
                name: 1,
                description: 1,
                owner: 1,
                totalVideos: 1,
                totalViews: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);
    if(!playlist){
        throw new ApiError(404, "PlayList Not Found");
        
    }
    return res.status(200).json(new ApiResponse(200, playlist,"Playlist Found successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id");
        
    }
    const playlist= await Playlist.findById(playlistId).populate("videos", "videoFile thumbnail title views isPublished owner createdAt duration _id");
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
        
    }
    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist Found"))
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params;
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id");
        
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id");
        
    }
    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found");
        
    }
    if(!video){
        throw new ApiError(404, "Video not found");
        
    }
    if (playlist.owner?.toString()!==req.user?._id.toString()) {
        throw new ApiError(401, "Not playlist owner");
        
    }
    const addedVideo = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $addToSet:{
                videos: videoId
            }
        },
        {new : true}

    ).populate("videos", "videoFile thumbnail title views isPublished owner createdAt duration _id");
    if(!addedVideo){
        throw new ApiError(500, "Error while adding the video");
        
    }
    // console.log("all about playl");
    
    const allVideos =   [...addedVideo.videos];
    console.log("Video added in playlist is :", allVideos);

    return res
    .status(200)
    .json(new ApiResponse(200, allVideos, "Video Added successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id");
        
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id");
        
    }
    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found"); 
    }
    if(!video){
        throw new ApiError(404, "Video not found");
    }
    if (playlist.owner?.toString()!==req.user?._id.toString()) {
        throw new ApiError(401, "Not playlist owner");
    }
    const removedVideo = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $pull:{
                videos: videoId
            }
        },
        {new: true}
    ).populate("videos", "videoFile thumbnail title views isPublished owner createdAt duration _id");
    console.log("Video removed from playlist :", removedVideo);
    if(!removedVideo){
        throw new ApiError(500, "Error while removing the video");
        
    }
    const removedVideos =   [...removedVideo.videos];
    console.log("Video added in playlist is :", removedVideos);

    return res
    .status(200)
    .json(new ApiResponse(200, removedVideos, "Video removed successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId){
        throw new ApiError(400, "Invali playlist id");
    }
    
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400, "Playlist not found");
    }
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can delete the playlist");
    }
    await Playlist.findByIdAndDelete(playlist?._id);
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist removed successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id");        
    }
    const {name, description} = req.body;
    if(!name || !description){
        throw new ApiError("Name and Description field is necessary");        
    }
    //TODO: update playlist
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(400, "Playlist not found");
    }
    if (playlist.owner?.toString()!==req.user?._id.toString()) {
        throw new ApiError(401, "Not playlist owner");
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist?._id,
        {
            $set:{
                name,
                description
            }
        },
        {new: true}
    )
    if(!updatedPlaylist){
        throw new ApiError(401,"Playlist Not updated");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}