import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'; // Use to help our server store, read, update and delete some cookies in the user's browser

const app = express();


app.use(cors({
    origin:process.env.CORS_ORIGIN,
}));
app.use(express.json({
    limit: process.env.JSON_LIMIT
}));  //  To help express take data in json format
app.use(express.urlencoded({extended:true, limit:process.env.JSON_LIMIT})) // To help express take data in url encoded format
app.use(express.static("public")) // To help save some data in a folder named public which can be accessed by any one
app.use(cookieParser());  // Perform CRUD Operation in the users browser




export {app};
