import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    //check if  user is owner
    if(channelId === req.user?._id.toHexString()){
        return res.status(200).json(
            new ApiResponse(201,"user is same as owner")
        )
    }
    // TODO: toggle subscription
    const channel = await Subscription.aggregate([{
        $match:{
            channel: new mongoose.Types.ObjectId(channelId),
        }  
    },{
        $match:{
            subscriber: new mongoose.Types.ObjectId(req.user?._id)
        }
    }])
    if(channel.length == 0){
        const newChannel = await Subscription.create({
            channel:channelId,
            subscriber:req.user?._id
        })  
        newChannel.save({validateBeforesave:false})
        return res.status(200).json(
            new ApiResponse(201,newChannel,"channel subscribed successfully")
        )
    }
    if(channel.length > 0){
        const channel1 = channel[0]
        await Subscription.findByIdAndDelete(channel1._id)
        return res.status(200).json(
            new ApiResponse(201,"channel unsubscribed successfully")
        )
    }
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

        const subscribers = await Subscription.aggregate([{
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },{
            $project:{
                subscriber:1,
            }
        }])
        return res.status(200).json(
            new ApiResponse(201,subscribers,'subscribers fetched successfully')
        )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    
    const channels = await Subscription.aggregate([{
        $match:{
            subscriber: new mongoose.Types.ObjectId(channelId)
        }
    },{
        $project:{
            channel:1
        }
    }])
    return res.status(200).json(
        new ApiResponse(201,channels,"channels fetched")
    )
})

const isSubscribedChannel = asyncHandler(async(req,res)=>{
    const {channelId} = req.params 
    const subscriber = await Subscription.aggregate([{
        $match:{
            channel: new mongoose.Types.ObjectId(channelId)
        }
    },{
        $match:{
            subscriber: new mongoose.Types.ObjectId(req.user?._id)
        }
    }])
    if(subscriber.length === 0){
        return res.status(200).json(
            new ApiResponse(201,"not subscribed")
        )
    }
    else{
        return res.status(200).json(
            new ApiResponse(201,"subscribed")
        )
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    isSubscribedChannel
}