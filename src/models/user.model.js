import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import util  from "util";
import mongooseAggregatePaginateV2 from "mongoose-aggregate-paginate-v2"
//bcrypt is used for encrpytion of password
//jwt is used for creating user Token (refreshToken)

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        unique:true
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String, // cloudinary url
        required:true
    },
    coverImage:{
        type:String // cloudinary url
    },
    watchHistory:[ // array of videos Schema
         {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Video"
         }
    ],
    password:{
        type:String,
        required:[true,'password is required']
    },
    refreshToken:{
        type:String
    }
},
{
    timestamps:true
}) 


//pre hook in mongoose->
//example = userSchema.pre("functionality(like before save , validat etc)",callback")

userSchema.pre("save",async function(next){// it is middleware,so next is used to flag the completion of this middleware
    
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,8)
    next()
})

//create a method for password validation in mongoose
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.Access_token_generator = async function(){
    const jwtAsync = util.promisify(jwt.sign)
    const token = await jwtAsync({
        _id : this._id,
        email : this.email,
        username: this.username,
        fullname:this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    })
    .then((token)=>{
        return token;
    }).catch((err)=>{console.log("token error: ",err)})
    return token
} 

userSchema.methods.Refresh_token_generator = async function(){
    const jwtAsync = util.promisify(jwt.sign)
    const token = await jwtAsync({
        _id : this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    })
    .then((token)=>{
        return token;
    }).catch((err)=>{console.log("token error: ",err)})
    return token
}  

userSchema.plugin(mongooseAggregatePaginateV2)

export const User = mongoose.model("User",userSchema)