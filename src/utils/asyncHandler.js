

/* it is a higher order wrapper function ->
const asyncHandler = (requestHandler)=> async(req,res,next)=>{
    try{
       await requestHandler(req,res,next)
    }
    catch(error){
        res.status(error.code || 500).json({
        success : false,
        message : error.message
        })
    }
}
*/

//other wrapper function function with promises


const asyncHandler = (requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}

