import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js" 

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name || !description){
        throw new ApiError(299,"name & description both are required")
    }

    //TODO: create playlist
    const playlist = await Playlist.create({
        name:name,
        description:description,
        owner:req.user?._id
    })
    await playlist.save({validateBeforesave:false})

    return res.status(200).json(
        new ApiResponse(201,playlist,"playlist created")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const playlists = await Playlist.aggregate([{
        $match:{
            owner: new mongoose.Types.ObjectId(userId)
        }
    },
    {
        $project:{
            _id:1
        }
    }])

    if(playlists.length === 0 || !playlists){
        return res.status(200).json(
            new ApiResponse(201,"no playlist is created by this user")
        )
    }
    else{
        return res.status(200).json(
            new ApiResponse(201,playlists,"playlists fetched")
        )
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const playlist =  await Playlist.findById(playlistId)
    if(!playlist){
        return res.status(200).json(
            new ApiResponse(201,"no such playlist exists")
        )
    }
    else{
        return res.status(200).json(
            new ApiResponse(201,playlist,"playlist fetched")
        )
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {videoId,playlistId} = req.params
    const video =  await Video.findById(videoId)
    const playlist =  await Playlist.findById(playlistId)

    if(!video ||  !playlist){
        throw new ApiError(404,"video or playlist is not exists")
    }
    else{
        const ownerId = new mongoose.Types.ObjectId(playlist.owner)
    const userId =  new mongoose.Types.ObjectId(req.user?._id)
    
    if(ownerId.toHexString()  !==  userId.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is not the owner of this playlist")
        )
    }
        const videoIncluded = await playlist.videos.includes(videoId)
        if(videoIncluded){
            return res.status(200).json(
                new ApiResponse(201,"video is already added in this playlist")
            )
        }
        else{
            var updatedPlaylist = await Playlist.updateOne(
                {_id:playlistId},
                {$push:{videos:videoId}}
            )
        }
        return res.status(200).json(
                new ApiResponse(201,updatedPlaylist,"video successfully added into playlist")
        )
    }

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    const video =  await Video.findById(videoId)
    const playlist =  await Playlist.findById(playlistId)

    if(!video ||  !playlist){
        throw new ApiError(404,"video or playlist is not exists")
    }
    else{
        const ownerId = new mongoose.Types.ObjectId(playlist.owner)
    const userId =  new mongoose.Types.ObjectId(req.user?._id)
    
    if(ownerId.toHexString()  !==  userId.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is not the owner of this playlist")
        )
    }
    const videoIncluded = await playlist.videos.includes(videoId)
    if(!videoIncluded){
        return res.status(200).json(
            new ApiResponse(201,"video is not included in this playlist")
        )
    }
            const updatedPlaylist = await Playlist.updateOne(
                {_id:playlistId},
                {$pull:{videos:videoId}}
            )
        
        return res.status(200).json(
            new ApiResponse(201,updatedPlaylist,"video successfully removed from playlist")
        )
    }

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    const playlist = await Playlist.findById(playlistId)
    const ownerId = new mongoose.Types.ObjectId(playlist.owner)
    const userId =  new mongoose.Types.ObjectId(req.user?._id)
    
    if(ownerId.toHexString()  !==  userId.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is not the owner of this playlist")
        )
    }
    await Playlist.findByIdAndDelete(playlistId)
    return res.status(200).json(
        new ApiResponse(201,"Playlist deleted")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!name || !description){
        return res.status(200).json(
            new ApiResponse(201,"no updated name or description")
        )
    }
    const playlist = await Playlist.findById(playlistId)
    const ownerId = new mongoose.Types.ObjectId(playlist.owner)
    const userId =  new mongoose.Types.ObjectId(req.user?._id)
    
    if(ownerId.toHexString()  !==  userId.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is not the owner of this playlist")
        )
    }
    playlist.name = name
    playlist.description = description
    await playlist.save({validateBeforesave:false})
    return res.status(200).json(
        new ApiResponse(201,playlist,"playlist updated")
    )
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
