import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import {Tweet} from "../models/tweet.model.js"
import { User } from "../models/user.model.js";
import aggregatePaginate  from "mongoose-aggregate-paginate-v2";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page, limit} = req.query

    const commentOwners = await Comment.aggregate([{
        $match:{
            video: new mongoose.Types.ObjectId(videoId)
        }
    },{
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"_id"
        }
    },{
        $project:{
            username:1,
            avatar:1
        }
    },{
        $skip: (page-1)*limit
    },{
        $limit: parseInt(limit)
    }])    

    const comments = await Comment.aggregate([{
        $match:{
            video: new mongoose.Types.ObjectId(videoId)
        }
    },{
        $skip: (page-1)*limit
    },{
        $limit: parseInt(limit)
    }])

    if(!comments){
        return res.status(200).json(
            new ApiResponse(201,"no comments under this video")
        )
    }

    const commentOwnersPageFinal =[]
    await commentOwners.forEach(e=>{
        const e1 = {fullname: e._id[0].fullname , avatar : e._id[0].avatar}
        commentOwnersPageFinal.push(e1)
    })

    return res.status(200).json(
        new ApiResponse(201,[commentOwnersPageFinal , comments ],"comments retrieved successfully")
    )

})

const getTweetComments = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    const {page = 1, limit = 10} = req.query

    const comments = await Comment.aggregate([{
        $match:{
            tweet: new mongoose.Types.ObjectId(tweetId),
        }
    }])

    const commentsPage = await Comment.aggregatePaginate(comments,{
        page:page,
        pageSize:limit
    })

    if(!commentsPage ){
        throw new ApiError(404,"Error while paginating the comments")
    }
    if(commentsPage.length == 0 ){
        return res.status(200).json(
            new ApiResponse(201,"no comments")
        )
    }
    const commentsPageFinal =[]
    await commentsPage.docs.forEach(e=>{
        const e1 ={"content":e.content,"owner":e.owner}
        commentsPageFinal.push(e1)
    })
    return res.status(200).json(
        new ApiResponse(201,commentsPageFinal,"comments retrieve successfully")
    )
})

const getcommentComments = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    const {page = 1, limit = 10} = req.query

    const comments = await Comment.aggregate([{
        $match:{
            comment: new mongoose.Types.ObjectId(commentId),
        }
    }])

    const commentsPage = await Comment.aggregatePaginate(comments,{
        page:page,
        pageSize:limit
    })

    if(!commentsPage ){
        throw new ApiError(404,"Error while paginating the comments")
    }
    if(commentsPage.length == 0 ){
        return res.status(200).json(
            new ApiResponse(201,"no comments")
        )
    }
    const commentsPageFinal =[]
    await commentsPage.docs.forEach(e=>{
        const e1 ={"content":e.content,"owner":e.owner}
        commentsPageFinal.push(e1)
    })
    return res.status(200).json(
        new ApiResponse(201,commentsPageFinal,"comments retrieve successfully")
    )
})

const addVideoComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body
    const {videoId} = req.params
    
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video does not exists")
    }
    const comment = await Comment.create({
        content:content,
        video:videoId,
        owner:req.user?._id
    })
    await comment.save({validateBeforesave:false})
    return res.status(200).json(
    new ApiResponse(201,comment,"comment added successfully")
    )
})

const addTweetComment =  asyncHandler(async(req,res)=>{
    const {content} = req.body
    const {tweetId} = req.params
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        return res.status(200).json(
            new ApiResponse(201,"this tweet not exists")
        )
    }
    if(!content || content.trim() === ""){
        return res.status(200).json(
            new ApiResponse(201,"the content of comment is missing")
        )
    }
    const comment = await Comment.create({
        content:content,
        tweet:tweetId,
        owner:req.user?._id
    })
    await comment.save({validateBeforesave:false})
    return res.status(200).json(
    new ApiResponse(201,comment,"comment added successfully")
    )
})

const addcommentComment =  asyncHandler(async(req,res)=>{
    const {content} = req.body
    const {commentId} = req.params
    const mainComment = await Comment.findById(commentId)
    if(!mainComment){
        return res.status(200).json(
            new ApiResponse(201,"this comment not exists")
        )
    }
    if(!content || content.trim() === ""){
        return res.status(200).json(
            new ApiResponse(201,"the content of comment is missing")
        )
    }
    const comment = await Comment.create({
        content:content,
        comment:commentId,
        owner:req.user?._id
    })
    await comment.save({validateBeforesave:false})
    return res.status(200).json(
    new ApiResponse(201,comment,"comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    const comment = await Comment.findById(commentId)

    const ownerId = new mongoose.Types.ObjectId(comment.owner)
    const userId =  new mongoose.Types.ObjectId(req.user?._id)
    
    if(ownerId.toHexString()  !==  userId.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is not the owner of this comment")
        )
    }

    if( !content || (content?.trim()==="")){
        throw new ApiError(404,"content of comment is null")
    }
    comment.content = content
    comment.save({validateBeforesave:false})
    return res.status(200).json(
        new ApiResponse(201,comment,"comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    const comment = await Comment.findById(commentId)

    const ownerId = new mongoose.Types.ObjectId(comment.owner)
    const userId =  new mongoose.Types.ObjectId(req.user?._id)
    
    if(ownerId.toHexString()  !==  userId.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is not the owner of this comment")
        )
    }
    await Comment.findByIdAndDelete(commentId)
    return res.status(200).json(
        new ApiResponse(201,"comment deleted successfully")
    )
})

export {
    getVideoComments,
    getTweetComments,
    getcommentComments, 
    addVideoComment,
    addTweetComment,
    addcommentComment, 
    updateComment,
    deleteComment
    }
