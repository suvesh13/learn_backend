import mongoose, { Schema } from "mongoose";
import mongooseAggregatePagination from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema({
    videoFile:{
        type:String, //cloudnary url
        required:true,
    },
    thumbnail:{
        type:String,  //cloudnary url
        required:true,
    },
    title:{
        type:String,
        require:true,
    },
    description:{
        type:String,
        require:true,
    },
    duration:{
        type:Number, // cloudnary url
        required:true
    },
    views:{
        type:Number,
        default:0,
    },
    isPublished:{
        type:Boolean,
        default:true,
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

videoSchema.plugin(mongooseAggregatePagination)

export const Video = mongoose.model("Video",videoSchema)