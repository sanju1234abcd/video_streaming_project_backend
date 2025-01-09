import mongoose from "mongoose";
import mongooseAggregatePaginateV2 from "mongoose-aggregate-paginate-v2" //use for writing aggregation queries in mongoose

const videoSchema = new mongoose.Schema({
    videoFile:{
        type:String, // cloudinary url
        required:true
    },
    thumbnail:{
        type:String,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type: Number ,
        required:true // cloudinary url
    },
    views:{
        type:Number,
        default:0
    },
    likes:{
        type:Number,
        default:0
    },
    isPublic:{
        type:Boolean,
        default:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},
{
    timestamps:true
})

videoSchema.plugin(mongooseAggregatePaginateV2)

export const Video = mongoose.model("Video",videoSchema)