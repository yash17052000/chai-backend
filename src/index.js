//require('dotenv').config({path:'./env'})
import dotenv from "dotenv"

import app from "./app.js";

import connectDB from "./db/index.js";



dotenv.config({path:'./env'})
connectDB().then(()=>{
    
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is running ${process.env.PORT}`);
    })
    
}).catch((error)=>{
    console.log("MONGO DB CONNECTION FAILED ERROR",error)
})



// THIS IS APPROACH NUMBER 1 
/*
import { express } from "express";
const app= express()
;( async ()=>{
try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("ERROR:",(error)=>{
        console.log("err:",error);
    })
    app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`);
    })
} catch (error) {
    console.log("ERROR:",error);
    throw error
}
})()
*/

// 2nd approach is to create separate function for it 