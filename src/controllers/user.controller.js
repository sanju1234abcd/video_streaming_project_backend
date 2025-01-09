import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import{uploadOnCloudinary} from "../utils/cloudinary.js"
import util from "util"
import jwt from "jsonwebtoken"
import { Domain } from "domain"
import mongoose from "mongoose"
import { WatchHistory } from "../models/watchHistory.model.js"

const registerUser = asyncHandler(async(req,res)=>{

    //how to create a user registration callback-> steps are given below
    //get user details from frontend(here postman is required)
    const {fullname,username,email,password} = req.body
    console.log("email: ",email)

    //validation
    if(
        [fullname,username,email,password].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }

    //check if user already exists: by username or email
    const existedBefore =await User.findOne({
        $or : [{ username },{ email }]
    })
    if(existedBefore){
        throw new ApiError(409,"username or email already exists")
    }

    //check for images,check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;

    let coverImageLocalPath;
    
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //if avatar is given, upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    //create user object - create entry in db 
    const user = await User.create({
        fullname ,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })  

    //remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //-password = password is not required
    )

    //check for user creation
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registing the user")
    }

    //console.log(createdUser)

    //return response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})

const AccessTokenandRefreshTokenGenerator=async(userId)=>{
    try{
        const user = await User.findById(userId);

    //as user.methods.token generators are not working properly so the token generators are written here

        const jwtAsync = util.promisify(jwt.sign)
    const accessToken = await jwtAsync({
        _id : user._id,
        email : user.email,
        username: user.username,
        fullname:user.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
    .then((token)=>{
        return token;
    }).catch((err)=>{console.log("token error: ",err)})

    const refreshToken = await jwtAsync({
        _id : user._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
    .then((token)=>{
        return token;
    }).catch((err)=>{console.log("token error: ",err)})

        user.refreshToken = refreshToken //enter refreshToken into the user db
        await user.save({validateBeforeSave:false})
        return {refreshToken,accessToken}
        }
        catch(error){
            throw new ApiError(500,"Something went wrong while creating tokens")
        }
}

const loginUser = asyncHandler(async(req,res)=>{
    //steps
    //collect data from req

    const {username,email,password} = req.body
    //username  or email
    if (!(username || email)) {
        throw new ApiError(400,"username or email required")
    }

    //find the user
    const user = await User.findOne({
        $or:[{email},{username}]
    })
    if (!user) {
        throw new ApiError(404,"User does not exist")
    }

    //password check

    //to use methods from mongoose model the syntax for user db => User == user
    const passwordValid = await user.isPasswordCorrect(password)
    if (!passwordValid) {
        throw new ApiError(404,"Invalid user credemtials(incorrect password)")
    }

    //access and refresh token
    const{refreshToken,accessToken} = await AccessTokenandRefreshTokenGenerator(user._id)

    //console.log("login token:",accessToken)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //send cookie
    const options={httpOnly:true,secure:true} // by this cookies can't be modified from frontend

    
    return res.status(200)
    .json(new ApiResponse(200,
        {
            user:loggedInUser,refreshToken,accessToken
        },
        "User logged in successfully"
    ))
    
    
})

const logOutUser = asyncHandler(async(req,res)=>{
    const options={httpOnly:true,secure:true} 

    await User.findByIdAndUpdate(req.user._id,
        {
            $set : {
                refreshToken :undefined
            }
        },
        {
            new:true
        }
    )
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("avatar",options)
    .json(
        new ApiResponse(200,{},"User logged out")
    )
})

const RefreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingrefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingrefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        // we know refreshToken is saved in user via AccesandRefreshTokenGenerator()
    
        if(incomingrefreshToken !== user.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
    
        //now generate new access token 
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {refreshToken,accessToken}= await AccessTokenandRefreshTokenGenerator(user._id);
        
        console.log(refreshToken)
        return res.status(200)
        .cookie("AccessToken",accessToken,options)
        .cookie("newRefreshToken",refreshToken,options)
        .json(
            new ApiResponse(200,
                {accessToken,refreshToken:refreshToken},
                "Access Token Refreshed"
            )
        )
    } 
    catch (error) {
        throw new ApiError(401,"Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{

    //collect old and new password
    const {oldpassword , newpassword} = req.body

    //we can get user by auth middleware(req.user)
    const user = await User.findById(req.user?._id)
    //validate password by isPasswordCorrect method

    const isPasswordCorrect1 = await user.isPasswordCorrect(oldpassword)

    if (!isPasswordCorrect1) {
        throw new ApiError(400,"Invalid old passsword")
    }

    //set new password

    user.password = newpassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(
        new ApiResponse(200,{},"Password stored successfully")
    )


})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(
        new ApiResponse(200,{user:req.user},"current user fetched successfully")
    )
})

const updateUserDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body
    
    const user = await User.findById(req.user?._id)
    
    if(fullname){
    if (fullname !== user.fullname) {
        user.fullname = fullname
        await user.save({validateBeforesave:false})
        console.log(user.fullname," ",fullname)
    }
    }
    if(email){
    if (email !== user.email) {
        user.email = email
        await user.save({validateBeforesave:false})
    }}
    
    return res.status(200).json(
        new ApiResponse(201,{user},"User Updated successfully")
    )
})

const updateAvatar = asyncHandler(async(req,res)=>{
    const newAvatarLocalPath = req.file?.path
    if(!newAvatarLocalPath){
        return res.status(200).json(
            new ApiResponse(201,{},"no avatar changed")
        )
    }

    const user = await User.findById(req.user?._id).select("-password")
    if(newAvatarLocalPath){
        const newAvatar = await uploadOnCloudinary(newAvatarLocalPath)
        console.log("old :",user.avatar)
        user.avatar = newAvatar?.url
        user.save({validateBeforeSave:false})
        console.log("new: ",user.avatar)
    }

    return res.status(200).json(
        new ApiResponse(201,user,"avatar updated successfully")
    )
})

const updatecoverImage = asyncHandler(async(req,res)=>{
    const newcoverImageLocalPath = req.file?.path

    if(!newcoverImageLocalPath){
        return res.status(200).json(
            new ApiResponse(201,{},"no coverImage changed")
        )
    }
    const user = await User.findById(req.user?._id).select("-password")
    if(newcoverImageLocalPath){
        const newcoverImage = await uploadOnCloudinary(newcoverImageLocalPath)
        console.log("old :",user.coverImage)
        user.coverImage = newcoverImage?.url
        user.save({validateBeforeSave:false})
        console.log("new: ",user.coverImage)
    }

    return res.status(200).json(
        new ApiResponse(201,user,"coverImage updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {userId} = req.params
    if(userId?.trim()=== ""){
        throw new ApiError(400,"userId is missing")
    }
    
    //using aggregation pipeline
    const channel = await User.aggregate([{
        $match:{
        _id: new mongoose.Types.ObjectId(userId)
        }
    },{
        $lookup:{
            from : "subscriptions", //it is coming from Subscription (as it is saved as subscriptions in db)
            localField:":_id",
            foreignField:"channel",
            as : "subscribers"
        }
    },{
        $lookup:{
            from : "subscriptions", //it is coming from Subscription (as it is saved as subscriptions in db)
            localField:":_id",
            foreignField:"subscriber",
            as : "subscribedTo"
        }
    },{
        $addFields:{ // adding extra fields
            subscribersCount:{
                $size:"$subscribers" // $ means it is a field
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo" // $size = sum
            },
            isSubscribed:{
                $cond:{
                    if:{
                        $in:[req.user?._id,"$subscribers.subscriber"]
                    },
                    then:true,
                    else:false
                }
            }
        }
    },{
        $project:{ /// by $project we give only selected elements flaged by 1(true)
            fullname:1,
            username:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1
        }
    }])
    if(channel?.length === 0){
        throw new ApiError(404,"channel does not exist")
    }
    return res.status(200).json(
        new ApiResponse(200,channel[0],"user channel fetched successfully")
    )
})

const userDelete = asyncHandler(async(req,res)=>{
    const options={httpOnly:true,secure:true} 

    User.findByIdAndDelete(req.user._id)
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("avatar",options)
    .json(
        new ApiResponse(200,{},"User deleted")
    )
})

const getWatchHistory = asyncHandler(async(req,res)=>{

    const user = await User.aggregate([
    {
        $match:{
            _id : new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $lookup:{
            from:"videos",
            localField:"watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline:[
                {
                    $lookup:{
                        from:"users",
                        localField:"owner",
                        foreignField:"_id",
                        as:"owner",
                        pipeline:[
                            {
                                $project:{
                                    fullname:1,
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                        owner:{
                            $first:"$owner"
                        }
                    }
                }
            ]
        }
    }])

    return res.status(200).json(
        new ApiResponse(201,user[0].watchHistory,"Watch History fetched successfully")
    )
})

const getWatchHistory1 = asyncHandler(async(req,res)=>{
    
    const watchHistory = await WatchHistory.findOne({watchedBy : req.user?._id})
    if(!watchHistory || (watchHistory.watchedVideos.length == 0)){
        return res.status(200).json(
            new ApiResponse(201,null,"no videos watched by this user")
        )
    }
    return res.status(200).json(
        new ApiResponse(201,watchHistory,"watchHistory fetched successfully")
    )
})

export {registerUser,loginUser,logOutUser,RefreshAccessToken,changeCurrentPassword,getCurrentUser,updateUserDetails,updateAvatar,updatecoverImage,getUserChannelProfile,userDelete,getWatchHistory,getWatchHistory1}
