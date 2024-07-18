class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went worng",
        error=[],
        stack=""
    ){
        super(message)
        this.statusCode = statusCode
        this.data=null
        this.message = message
        this.success = false;
        this.error = error

        if(stack){
            this.stack = stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export { ApiError }