import { Router } from 'express';
import {
    addVideoComment,
    getTweetComments,
    getcommentComments,
    addTweetComment,
    addcommentComment, 
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../midddlewares/auth.middleware.js"

const commentRouter = Router();


commentRouter.route("/:videoId").get(getVideoComments).post(verifyJWT,addVideoComment);
commentRouter.route("/:tweetId").get(getTweetComments).post(verifyJWT,addTweetComment);
commentRouter.route("/:commentId").get(getcommentComments).post(verifyJWT,addcommentComment);
commentRouter.route("/c/:commentId").delete(verifyJWT,deleteComment).patch(verifyJWT,updateComment);

export default commentRouter