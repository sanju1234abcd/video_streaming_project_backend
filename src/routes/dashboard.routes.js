import { Router } from 'express';
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js"
import {verifyJWT} from "../midddlewares/auth.middleware.js"

const dashboardRouter = Router();

dashboardRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

dashboardRouter.route("/:channelId/stats").get(getChannelStats);
dashboardRouter.route("/:channelId/videos").get(getChannelVideos);

export default dashboardRouter