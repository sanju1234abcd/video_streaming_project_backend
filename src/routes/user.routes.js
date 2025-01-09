import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory,getWatchHistory1, loginUser, logOutUser, RefreshAccessToken, registerUser, updateAvatar, updatecoverImage, updateUserDetails,userDelete } from "../controllers/user.controller.js";
import {upload} from "../midddlewares/multer.middleware.js"
import { verifyJWT } from "../midddlewares/auth.middleware.js";

const userRouter = Router()

userRouter.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)

userRouter.route("/login").post(loginUser)

//secured routes
userRouter.route("/logout").post(verifyJWT,logOutUser)
userRouter.route("/refreshToken").post(RefreshAccessToken)
userRouter.route("/change-password").post(verifyJWT,changeCurrentPassword)
userRouter.route("/current-user").get(verifyJWT,getCurrentUser)
userRouter.route("/update").post(verifyJWT,updateUserDetails) // patch is used to update only one or selected fields
userRouter.route("/updateAvatar").post(verifyJWT, upload.single("avatar") ,updateAvatar)
userRouter.route("/updatecoverImage").patch(verifyJWT, upload.single("coverImage") ,updatecoverImage)
userRouter.route("/c/:userId").get(getUserChannelProfile)
userRouter.route("/delete").post(verifyJWT,userDelete)
userRouter.route("/watch-history").get(verifyJWT,getWatchHistory1)




export default userRouter