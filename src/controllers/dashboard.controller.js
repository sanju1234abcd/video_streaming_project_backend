import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelId} = req.params

    const videos = await Video.aggregate([{
        $match:{
            owner: new mongoose.Types.ObjectId(channelId)
        }
    },{
        $project:{
            views:1,
            likes:1
        }
    }])

    const subscribers = await Subscription.aggregate([{
        $match:{
            channel: new mongoose.Types.ObjectId(channelId)
        }
    },{
        $project:{
            subscriber:1
        }
    }])

    let likes = 0
    videos.map((video)=>{
        likes = likes + video.likes
    })

    let views = 0
    let videoLenth = 0

    videos.map((video)=>{
        views = views + video.views
        videoLenth += 1
    })

    const result = {totalVideoViews : views , totalSubscribers : subscribers.length , totalVideos : videoLenth,totalLikes:likes}

    return res.status(200).json(
        new ApiResponse(201,result,"stats fetched successfully")
    )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    var {channelId} = req.params 
    const videos = await Video.aggregate([{
        $match:{
            owner: new mongoose.Types.ObjectId(channelId)
        }
    },{
        $project:{
            title:1,
            desccription:1,
            videoFile:1,
            thumbnail:1,
            views:1,
            likes:1,
        }
    }])
    if(!videos){
        throw new ApiError(404,"Channel not found")
    }
    return res.status(200).json(new ApiResponse(201,videos,"Videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }