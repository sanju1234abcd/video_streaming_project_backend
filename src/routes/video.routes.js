import { Router } from 'express';
import {
    getRandomVideos,
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
    videoViewsIncreaser,
    videoWatched
} from "../controllers/video.controller.js"
import {verifyJWT} from "../midddlewares/auth.middleware.js"
import {upload} from "../midddlewares/multer.middleware.js"

const videoRouter = Router();

videoRouter.route("/search").get(getAllVideos)

    videoRouter
    .route("/")
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

videoRouter.route('/random').get(getRandomVideos);
videoRouter
    .route("/:videoId")
    .get(getVideoById)
    .delete(verifyJWT,deleteVideo)
    .patch(upload.single("thumbnail"),verifyJWT, updateVideo);

videoRouter.route("/toggle/publish/:videoId").patch(verifyJWT,togglePublishStatus);
videoRouter.route('/views/:videoId').post(videoViewsIncreaser)
videoRouter.route('/addToWatchHistory/:videoId').post(verifyJWT,videoWatched)

export default videoRouter