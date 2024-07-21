import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiRespinse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


//generate token when login 
const generateAccessAndRefereshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}

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

const loginUser = asyncHandler( async(req,res)=>{
    // steps-
    /*  1) req.bady -> data
            username or email
        2) find the user
        3) password check
        4) generate accessToken and refreshToken
        5) send cookies
    */
    
    const {email,userName,password} = req.body

    if(!userName && !email){  // if i am not sure about username or email is taken when login process then..
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({ // $or is check [username or email] on of them is present in db if it not present then it store null
        $or: [{userName} , {email}]
    })

    if(!user){ //if in db user not prensent then ..
        throw new ApiError(404,"User does not exist")
    }

    // if email or username is prensent
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw ApiError(401,"Invalid user Credentials")
    }

    const {accessToken,refreshToken} =  await generateAccessAndRefereshTokens(user._id) //isPasswordValid is correct therefore we create access ans refresh token

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken") //we don't want give password and refreshToken to user when he loggin

    //send cookies
    const options = {
        //cookies bydefault modify by anyone in frontend
        httpOnly:true,  //1
        secure:true,  //2
         
        //after above step [1,2] it only modify by the server only
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiRespinse(
            200,
            {
                user:loggedInUser,accessToken,refreshToken
            },
            "User logged In Successfully"
        )
    )


    
})

const logoutUser = asyncHandler( async(req,res)=>{  //for logout we need [User._id] but we not get directly [user._id] therefore using middleware we get [user._id] (auth.middleware.js)and verifyJWT[method of auth.middleware.js] provide user._id(by next())[error,req,res,next](provieded) ... 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options = {
        //cookies bydefault modify by anyone in frontend
        httpOnly:true,  //1
        secure:true,  //2
         
        //after above step [1,2] it only modify by the server only
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiRespinse(200,{},"User logged Out"))

})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || refreshAccessToken.body.refreshToken 

    if(!incomingRefreshToken){
        throw ApiError(401,"Unauthorized required")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiRespinse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
    
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
}