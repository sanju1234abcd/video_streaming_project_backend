import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary , deleteFromCloudinary} from "../utils/cloudinary.js"
import { upload } from "../midddlewares/multer.middleware.js"
import videoRouter from "../routes/video.routes.js"
import jwt from "jsonwebtoken";
import { WatchHistory } from "../models/watchHistory.model.js"

const getRandomVideos = asyncHandler(async(req,res)=>{
    const videos = await Video.aggregate([{
        $sample:{size:6}
    }])
    res.status(200).json(
        new ApiResponse(201,videos,"videos fetched randomly successfully")
    )
})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, fullName , channelId} = req.query
    //TODO: get all videos based on query, sort, pagination
    
    var videos1;
    if(query){
    var queries = query.replace(" ",".*")
    if(query.includes("edit")){
        const edit = query.replace('edit',"")
        queries = edit.replace(" ",".*") + ".*edit"
    }
    if(query.includes("tutorial")){
        const tutorial = query.replace('tutorial',"")
        queries = tutorial.replace(" ",".*") + ".*tutorial"
    }
    if(fullName){
    var userIDs1 = await User.aggregate([{
        $match:{
            fullname: {$regex : fullName , $options: 'i'}
        }
    },{
        $project:{
            _id:1,
            fullname:1
        }
    }])

    var userIDs = []

    userIDs1.map((userId,index)=>{
        userIDs.push(new mongoose.Types.ObjectId(userId._id))
    })
    
    }


    if((sortBy.trim() == 'none') && fullName){
        videos1 = await Video.aggregate([{
            $match:{
                $or:[{title:{$regex: queries,$options:'i'}},
                    {description:{$regex: queries,$options:'i'}}
                    ]
            }
        },{
            $match:{
                owner:{$in:userIDs}
            }
        }])
    }
    else if((sortBy.trim() == 'none') && !fullName){
        videos1 = await Video.aggregate([{
            $match:{
                $or:[{title:{$regex: queries,$options:'i'}},
                    {description:{$regex: queries,$options:'i'}}
                    ]
            }
        }])
    }
    else if(sortBy == 'views' && fullName){
     videos1 = await Video.aggregate([{
        $match:{
            $or:[{title:{$regex: queries,$options:'i'}},
                {description:{$regex: queries,$options:'i'}}
                ]
        }
    },{
        $match:{
            owner:{$in:userIDs}
        }
    },
    {
        $sort:{
            views : parseInt(sortType)
        }
    }])
    }
    else if(sortBy == 'views' && !fullName){
        videos1 = await Video.aggregate([{
           $match:{
               $or:[{title:{$regex: queries,$options:'i'}},
                   {description:{$regex: queries,$options:'i'}}]
           }
       },{
           $sort:{
               views : parseInt(sortType)
           }
       }]) 
    }
    else if(sortBy == 'likes' && fullName){
         videos1 = await Video.aggregate([{
            $match:{
                $or:[{title:{$regex: queries,$options:'i'}},
                    {description:{$regex: queries,$options:'i'}}]   
            }
        },{
            $match:{
                owner : {$in : userIDs}
            }
        },{
            $sort:{
                likes : parseInt(sortType)
            }
        }])
    }
    else if(sortBy == 'likes' && !fullName){
        videos1 = await Video.aggregate([{
           $match:{
               $or:[{title:{$regex: queries,$options:'i'}},
                   {description:{$regex: queries,$options:'i'}}]
           }
       },{
           $sort:{
               likes : parseInt(sortType)
           }
       }])
    }
    }
    else if(!query){
        videos1 = await Video.aggregate([{
            $match:{
                owner : new mongoose.Types.ObjectId(channelId)
            }
        }])
    }
    
    if(!videos1){
        throw new ApiError(404,"error while fetching searched videos")
    }
    
    const videos = videos1.slice((limit*(page-1)),(limit*page))
    
    if(videos.length == 0){
        return res.status(200).json(
            new ApiResponse(201,null,"no videos")
        )
    }

    return res.status(200).json(
        new ApiResponse(201,videos,`${query ? 'Videos fetched successfully' : `${videos1.length}`}`)
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    const videoFilePath = req.files?.videoFile[0]?.path
    const thumbnailPath = req.files?.thumbnail[0]?.path
    if( (title?.trim() ==="") || (description?.trim()==="") || !videoFilePath || !thumbnailPath){
        throw new ApiError(299,"All fields are required")
    }

    const video = await uploadOnCloudinary(videoFilePath)
    const Thumbnail = await uploadOnCloudinary(thumbnailPath)
    
    const publishedvideo = await Video.create({
        videoFile : video.url,
        thumbnail : Thumbnail.url,
        title : title,
        description : description,
        duration : video.duration.toFixed(2),
        views : 0,
        isPublic : true,
        owner : req.user?._id
    })

    return res.status(200).json(
        new ApiResponse(201,publishedvideo,"video published succesfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video does not exists")
    }

    return res.status(200).json(
        new ApiResponse(201,video,"video fetched succesfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description} =  req.body
    const thumbnail = req.file?.path
    if(!title && !description && !thumbnail){
        return res.status(200).json(new ApiResponse(201,"nothings updated"))
    }

    if(title?.trim()=== ""){
        throw new ApiError(299,"no title")
    }
    if(description?.trim()=== ""){
        throw new ApiError(299,"no description")
    }
    const video = await Video.findOne({_id:videoId})
    if(!video){
        throw new ApiError(404,"video does not exists")
    }

    const ownerId = new mongoose.Types.ObjectId(video.owner)
    const userId = new mongoose.Types.ObjectId(req.user?._id)
    
    if(ownerId.toHexString()  !==  userId.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is not the owner of this video")
        )
    }
    else{
        if(!thumbnail){
            video.title = title
            video.description =  description
            await video.save({validateBeforesave:false})
        }
        else{
            video.title = title
            video.description =  description
            const thumbnailPath = await uploadOnCloudinary(thumbnail)
            video.thumbnail = thumbnailPath.url
            await video.save({validateBeforesave:false})
        }
}
    return res.status(200).json(
        new ApiResponse(201,video,"video details updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.findOne({_id:videoId})
    if(!video){
        throw new ApiError(404,"video does not exists")
    }

    // check if video owner is same as user
    const ownerId = new mongoose.Types.ObjectId(video.owner)
    const userId = new mongoose.Types.ObjectId(req.user?._id)

    if(ownerId.toHexString()  !==  userId.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is not the owner of this video")
        )
    }
    const thumbnail_public_id = video.thumbnail.split('/').slice(-1)[0].replace('.jpg','')
    const videoFile_public_id = video.videoFile.split('/').slice(-1)[0].replace('.mp4','')
    console.log(thumbnail_public_id,videoFile_public_id)
    const deleteres = await deleteFromCloudinary(thumbnail_public_id,videoFile_public_id)
    
    await Video.findByIdAndDelete(videoId)
    return res.status(200).json(new ApiResponse(201,"video is deleted"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video does not exists")
    }
    const ownerId = new mongoose.Types.ObjectId(video.owner)
    const userId = new mongoose.Types.ObjectId(req.user?._id)

    if(ownerId.toHexString()  !==  userId.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is not the owner of this video")
        )
    }
    video.isPublic = !(video.isPublic)
    video.save({validateBeforesave:false})
    return res.status(200).json(
        new ApiResponse(201,video,"toggled publication")
    )

})

const videoViewsIncreaser = asyncHandler(async(req,res)=>{
    const {videoId}= req.params
    const video = await Video.findById(videoId)
    const ownerId =  video.owner
    var userId =  null
    const token = req.cookies?.accessToken || req.headers["authorization"]?.replace("Bearer ","")
    if(token){
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        userId = decodedToken?._id
    }
    userId = userId ? userId :  null
    if(ownerId.toHexString() !== userId){
        video.views = video.views + 1
        await video.save({validateBeforesave:false})
        return res.status(200).json(
            new ApiResponse(201,"view increased successfully")
        )
    }
    else{
        return res.status(200).json(
            new ApiResponse(201,"views cannot be increased as the watcher is the owner of this video")
        )
    }
})

const videoWatched = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const video = await Video.findById(videoId)
    const ownerId =  video.owner
    let watchHistory = await WatchHistory.findOne({
        watchedBy : req.user?._id
    })
    
    if(!watchHistory){
            watchHistory = await WatchHistory.create({
            watchedBy : req.user?._id
        })
        watchHistory.save({validateBeforesave:false})
    }
        const VideoId = new mongoose.Types.ObjectId(videoId)
        
        
        if((watchHistory.watchedVideos.length == 0) && (ownerId.toHexString() !== (req.user?._id).toHexString())){
            await WatchHistory.updateOne(
                {watchedBy : req.user?._id},
                {$push:{watchedVideos : videoId}}
            )
        }
        else if( (ownerId.toHexString() !== (req.user?._id).toHexString()) && (VideoId.toHexString() !== watchHistory.watchedVideos[(watchHistory.watchedVideos.length - 1)].toHexString())){
            await WatchHistory.updateOne(
            {watchedBy : req.user?._id},
            {$push:{watchedVideos : videoId}}
        ) 
        }
        return res.status(200).json(
            new ApiResponse(201,watchHistory,"watchHistory updated successfully")
        )
})

export {
    getRandomVideos,
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    videoViewsIncreaser,
    videoWatched
}
