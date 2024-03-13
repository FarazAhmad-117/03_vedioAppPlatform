import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async()=>{
    try {
        // const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) // Remote DATABase;
        const connectionInstance = await mongoose.connect(`${process.env.OFFLINE_MONGODB_CONNECTION_STRING}/${DB_NAME}`) // My LOCAL DataBase;
        console.log(`MongoDB Connected !!! DB Host: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("MONGODB connection FAILED",error);
        process.exit(1);
    }
}

export default connectDB;


