import mongoose from "mongoose";

const WatchHistorySchema = new mongoose.Schema({
    watchedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    watchedVideos:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"   
    }]
})

export const WatchHistory = mongoose.model("WatchHistory",WatchHistorySchema)