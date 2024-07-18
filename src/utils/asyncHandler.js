const asyncHandler = (requestHandler)=>{
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}




/* this is method 2 and above methed 1

// const asyncHandler = (fn) => {()=>{}} // [fn-function]
    // (fn) => ()=>{}
    // (fn) => async()=>{}

// try catch
const asyncHandler = (fn) => async(req,res,next)=>{
    try {
        await fn(req,res,next)
    } catch (error) {
        res.status(err.code || 500).jsion({
            success:false, //tell sucess flg true or false[correct]
            message:err.message
        })
    }
}

*/
export { asyncHandler }

