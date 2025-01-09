import mongoose from 'mongoose';
import dotenv from "dotenv";
import { app } from './app.js';

dotenv.config({
    path:'./.env'
})


const dbConnect = async()=>{
try{ 
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`,{
    useNewurlParser:true,
    useUnifiedTopology:true 
    })
    console.log("Mongodb Connection succcesfull!!")
}
catch(error){
    console.log("database error : ",error)
}

}

dbConnect()
.then(()=>{

    app.on("error",(error)=>{
        console.log("on listen error: ",error)
        throw error
    })

    app.listen(process.env.PORT || 8000,()=>{
        console.log("listening at ",process.env.PORT)
    })

    
})
.catch((error)=>{
    "Mongodb connection failed : ",error
});


