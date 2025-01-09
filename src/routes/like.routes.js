import { Router } from 'express';
import {
    getLikedVideos,
    getLikedComments,
    getCommentLikes,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like.controller.js"
import {verifyJWT} from "../midddlewares/auth.middleware.js"

const likeRouter = Router();

likeRouter.route("/toggle/v/:videoId").post(verifyJWT,toggleVideoLike);
likeRouter.route("/toggle/c/:commentId").post(verifyJWT,toggleCommentLike);
likeRouter.route("/c/:commentId").get(getCommentLikes)
likeRouter.route("/toggle/t/:tweetId").post(verifyJWT,toggleTweetLike);
likeRouter.route("/likedVideos").get(verifyJWT,getLikedVideos);
likeRouter.route("/likedComments").get(verifyJWT,getLikedComments);
export default likeRouter