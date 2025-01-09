class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors =[],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data  = null
        this.message = message
        this.success =false
        this.errors = errors

        //dont need to understand this as it is for industrial use only
        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}