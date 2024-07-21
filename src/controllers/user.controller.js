import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiRespinse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async(req,res)=>{
    // steps-
    /*
        1)get user details from frontend[name,email,password,avtar,img,..which is required[user.model.js]]
        2)validate - not empty [ex- (name,email,..)are field is not empty]
        3)check if user already exists:[username,email,..]
        4)check for image, check for avatar [this is  reqired field therefore this field checking]
        5)upload them to cloudinary,avatar
        6)create user object - create entry in db
        7)remove password and refresh token field from response [because we dont won't give back to this[password,refreshToken] field to  user ]
        8)check for user creation[check acually user is create or we get null response]
        9)if create users then return response
    */
   const {fullName,email,password,userName} = req.body; //[form,json type data get in req.body]
   
    // console.log("fullName",fullName);
    // console.log("email",email);
    // console.log("password",password);
    // console.log("userName",userName);
   //for validation[not empty]
   //step -1 
   /*
    check each field like..
        if(fullName === ""){
            throw new ApiError(400,"fullName is required")
        }
   */

    //step -2

    if(
        [fullName,email,userName,password].some((field)=>
        field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }

    // ////////////

    //check user already exist or not

    const existedUser = await User.findOne({
        $or:[{ userName },{ email }]  //$or mean it check any one is present [like or in java]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path; //we add middleware in use.router[middleware] therefore get access of img,coverImg. alltime it not get therefore we check condionaly
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; // coverImage is not required in register therefore is can be empty therefore it check by classic if-else

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }



    
   

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    // upload this file[avatar, coverImage(can be empty)] on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    console.log("avatar:",avatar);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    //create object in db

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        userName:userName.toLowerCase()

    })

    //next step is check that user create in db or not

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"  //In this step we removing password,refreshToken [step-7 up]
    ) //check by id userId because whenever we create new user then db create one unique id for each therefore we check using id

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user") //[step-8]
    }

    return res.status(201).json(
        new ApiRespinse(200,createdUser,"User registered Sucessfully")
    )

})

export {registerUser}