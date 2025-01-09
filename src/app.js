import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
//routes import 
import userRouter from "./routes/user.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import likeRouter from "./routes/like.routes.js"
import videoRouter from "./routes/video.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import commentRouter from "./routes/comment.routes.js"
import subscribtionRouter from "./routes/subscription.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials : true,
    exposedHeaders:['Set-Cookie']
}))

app.use(express.json({limit:"10kb"})) // for json file
app.use(express.urlencoded({extended:true,limit:"10kb"})) // for url encoded file
app.use(express.static("public"))

app.use(cookieParser()) // to do CRED operations with browser cookies

//routes declaration
app.use('/api/v1/users',userRouter)
app.use('/api/v1/tweets',tweetRouter)
app.use('/api/v1/likes',likeRouter)
app.use('/api/v1/videos',videoRouter)
app.use('/api/v1/playlists',playlistRouter)
app.use('/api/v1/comments',commentRouter)
app.use('/api/v1/subscribtions',subscribtionRouter)
app.use('/api/v1/dashboards',dashboardRouter)
app.use('/api/v1/healthCheck',healthcheckRouter)

export {app}



