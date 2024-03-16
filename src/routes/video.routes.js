import { Router } from "express";
import {createVideo} from '../controllers/video.controller.js'
const router = new Router();


// Seting up routers Listenting at /api/v2/videos;

router.route("/create").post(createVideo);






export default router;

