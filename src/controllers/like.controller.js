import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const user =  req.user?._id
    //if(isValidObjectId(tweetId)){
        //throw new ApiError(404,"no tweet exists of this tweetId")
    //}
    let likedUser = await Like.findOne({likedBy:{$in:[req.user?._id]}})
    if(!likedUser){
        likedUser = await Like.create({
            likedBy:user._id
        })
        await likedUser.save({validateBeforeSave:false})
    }

    const videoExistence = await likedUser.video.includes(videoId) /// check if the video is liked or not
    let updatedLikedUser
    if(!videoExistence){
        updatedLikedUser =await Like.updateOne(
        {likedBy:user._id},
    { $push : {  video : videoId } } ) //adds the videoId
    const video = await Video.findById(videoId)
    video.likes =  video.likes + 1
    video.save({validateBeforeSave:false})
    }
    else{
        updatedLikedUser =await Like.updateOne(
            {likedBy:user._id},
        { $pull : {  video : videoId } } ) //deletes the videoId
        const video = await Video.findById(videoId)
        video.likes =  video.likes - 1
        video.save({validateBeforeSave:false})
    }
    
    return res.status(200).json(
        new ApiResponse(201,updatedLikedUser,"toggled video like")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const user =  req.user?._id
    //if(isValidObjectId(tweetId)){
        //throw new ApiError(404,"no tweet exists of this tweetId")
    //}
    let likedUser = await Like.findOne({likedBy:{$in:[req.user?._id]}})
    if(!likedUser){
        likedUser = await Like.create({
            likedBy:user._id
        })
        await likedUser.save({validateBeforeSave:false})
    }

    const commentExistence = await likedUser.comment.includes(commentId) /// check if the comment is liked or not
    let updatedLikedUser
    if(!commentExistence){
        updatedLikedUser =await Like.updateOne(
        {likedBy:user._id},
    { $push : {  comment : commentId } } ) //adds the commentId
    //updatedLikedUser.save({validateBeforeSave:false})
    }
    else{
        updatedLikedUser =await Like.updateOne(
            {likedBy:user._id},
        { $pull : {  comment : commentId } } ) //deletes the commentId
        
    //updatedLikedUser.save({validateBeforeSave:false})
    }
    
    return res.status(200).json(
        new ApiResponse(201,updatedLikedUser,"toggled comment like")
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    try{
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const user =  req.user?._id
    //if(isValidObjectId(tweetId)){
        //throw new ApiError(404,"no tweet exists of this tweetId")
    //}
    let likedUser = await Like.findOne({likedBy:{$in:[req.user?._id]}})
    if(!likedUser){
        likedUser = await Like.create({
            likedBy:user._id
        })
        await likedUser.save({validateBeforeSave:false})
    }

    const tweetExistence = await likedUser.tweet.includes(tweetId) /// check if the tweet is liked or not
    let updatedLikedUser
    if(!tweetExistence){
        updatedLikedUser =await Like.updateOne(
        {likedBy:user._id},
    { $push : {  tweet : tweetId } } ) //adds the tweetId
    //updatedLikedUser.save({validateBeforeSave:false})
    }
    else{
        updatedLikedUser =await Like.updateOne(
            {likedBy:user._id},
        { $pull : {  tweet : tweetId } } ) //deletes the tweetId
        console.log(updatedLikedUser)
    //updatedLikedUser.save({validateBeforeSave:false})
    }
    
    return res.status(200).json(
        new ApiResponse(201,updatedLikedUser,"toggled tweet like")
    )}
    catch(err){
        throw new ApiError(404,"Error in toggling like")
    }
}
)

const getCommentLikes = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    
    const likes = await Like.aggregate([{
        $match:{
            comment : {$in:[new mongoose.Types.ObjectId(commentId)]}
        }
    }])
    
    return res.status(200).json(
        new ApiResponse(201,likes.length,"likes retrieved successfully")
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedUser = await Like.findOne({likedBy : req.user?._id})
    if(!likedUser){
        return res.status(200).json(
            new ApiResponse(201,null,"user has not liked any videos till now")
        )
    }
    
    const likedVideos = likedUser.video
    
    if((!likedVideos) || (likedVideos.length === 0)){
        return res.status(200).json(
            new ApiResponse(201,null,"no videos liked by this User")
        )
    }

    return res.status(200).json(
        new ApiResponse(201,likedVideos,"Liked videos retrived")
    )

})

const getLikedComments = asyncHandler(async(req,res)=>{
    const comments = await Like.aggregate([{
        $match:{
            likedBy : req.user?._id
        }
    },{
        $match:{
            comment : {$exists :true , $ne : null}
        }
    }])
    
    if(!comments){
        return res.status(200).json(
            new ApiResponse(201,null,'no comments liked by this user')
        )
    }
    
    return res.status(200).json(
        new ApiResponse(201,comments,"Liked comments retrieved")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getCommentLikes,
    getLikedVideos,
    getLikedComments
}