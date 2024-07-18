import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
    userName:{
        type:String,
        required:true,
        lowwercase:true,
        unique:true,
        trim:true,
        index:true // if we want any filed searchable then we made it index[true]; (searchable )
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowwercase:true,
        trim:true
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avtar:{
        type:String, //cloudinary url
        required:true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video",
        }
    ],
    password:{
        type:String, //should be encrypt 
        required:[true,"Password is required"]
    },
    refreshToken:{
        type:String,
    }

},{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password"))return next(); //code only run when password is modified by user or at the first time when it create. therefore here it check it modified or not..
    
    this.password = bcrypt.hash(this.password,10)
    next()
}) // here we use only normal function because array function not have (this) refference[mean context]. and it is complex proccess therefore it use async.

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){  //token generate
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            useName:this.useName,
            fullName:this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema);

