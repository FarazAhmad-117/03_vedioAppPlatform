import connectDB from "./db/index.js";
import dotenv from "dotenv";


dotenv.config({
    path: "./.env"
});
connectDB();














/*

import express from "express";
const app = express();
;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on('error',(error)=>{
            console.log('Database is unable to connect with the database',error);
            throw error;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`Server is listening on port https://localhost:${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR::CONNECTING DATABASE",error);
        throw error;
    }
})()

*/
