import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if(content?.trim() === "" ){
        throw new ApiError(201,"no content in tweet")
    }

    const user = await User.findById(req.user?._id)

    const tweet = await Tweet.create({
        content:content,
        owner: user._id
    })

    return res.status(200).json(
        new ApiResponse(201,tweet,"Tweet created succesfully")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const {userId} =  req.params
    const {page=1 , limit=5} = req.query;
    const user = await User.findOne({
        $or:[{_id:userId}]
    })

    if(!user){
        throw new ApiError(399,"userId not exists")
    }
    const tweets = await Tweet.aggregate([{
        $match:{
            owner : user._id
        }
    },{
        $skip: (page-1)*limit
    },{
        $limit: page*limit
    }])
    if(!tweets){
        res.status(200).json(
            new ApiResponse(201,"No tweets from this user")
        )
    }

    return res.status(200).json(
        new ApiResponse(201,tweets,"Tweets collected")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"tweet does not exists")
    }
    if(!content || (content?.trim() === "") ){
        throw new ApiError(404,"no content provided")
    }
    const ownerId = new mongoose.Types.ObjectId(tweet.owner)
    const userId =  new mongoose.Types.ObjectId(req.user?._id)
    
    if(ownerId.toHexString()  !==  userId.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is not the owner of this tweet")
        )
    }
    if(!(content?.trim() === "") || content){
    tweet.content = content
    await tweet.save({validateBeforesave:false})
    }

    return res.status(200).json(
        new ApiResponse(201,tweet,"tweet updated successfully(if content is not provided  then prev content will remain")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"tweet does not exists")
    }
    const ownerId = new mongoose.Types.ObjectId(tweet.owner)
    const userId =  new mongoose.Types.ObjectId(req.user?._id)
    
    if(ownerId.toHexString()  !==  userId.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is not the owner of this tweet")
        )
    }
    await Tweet.findByIdAndDelete(tweetId)
    return res.status(200).json(
        new ApiResponse(201,"tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
