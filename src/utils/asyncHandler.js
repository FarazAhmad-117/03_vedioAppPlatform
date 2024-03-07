
// Using Promises=>
const  asyncHandler = (requestHandler)=>{
    return (req, res, next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err));
    }
}

export {asyncHandler};






// Using TryCatch
// const asyncHandler = (fn) => async(req, res, next)=> {
//     try {
//         await fn(req,res,next);
//     } catch (error) {
//         res.send(error.code || 500).json({
//             status:false,
//             message: error.message
//         });
//     }
// }

