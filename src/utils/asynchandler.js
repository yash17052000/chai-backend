
/* in javascript if we pass higher order function as argument */


// const asynchandler =()=>{}
// const asynchandler= (func)=>()=>{}// further aaga fucnc ko pass krn h to aaga
// //aysnc banana h to 
// const asynchandler =(func)=>async ()=>{} /// agag async use krka hum hihger odrer function ko execute kr ra hein



// using try catch
// const asynchandler =(fn)=>async (req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(error.code||500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }


// using promise 
// const asynchandler=(requesthandler)=>{
// (req,res,next )=>{
// Promise.resolve(requesthandler(req,res,next)).catch((err)=>next(err))
// }
// }




const asynchandler=(requesthandler)=>{
    (req,res,next )=>{
    Promise.resolve(requesthandler(req,res,next)).catch((err)=>next(err))
    }
    }
    