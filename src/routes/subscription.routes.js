import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
    isSubscribedChannel
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../midddlewares/auth.middleware.js"

const subscribtionRouter = Router();
//subscribtionRouter.use(); // Apply verifyJWT middleware to all routes in this file

subscribtionRouter
    .route("/c/:channelId") // here channelId and subscriberId are also userId
    .get(verifyJWT,getSubscribedChannels)
    .post(verifyJWT,toggleSubscription);

subscribtionRouter.route("/u/:channelId").get(getUserChannelSubscribers);
subscribtionRouter.route("/s/:channelId").get(verifyJWT,isSubscribedChannel);


export default subscribtionRouter