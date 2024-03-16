import {Router} from 'express'
import { login, logout, registerUser } from '../controllers/user.controller.js';
import {upload} from './../middlewares/multer.middleware.js'; 
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// All Routers Listenting at /api/v2/users;

router.route("/register").post(
    upload.fields([   // multer midleware
        {
            name:'avatar',
            maxCount:1
        },
        {
            name:'coverImage',
            maxCount:1
        }
    ]),
    registerUser
);

router.route("/login").post(login);
router.route("/logout").post(verifyJWT,logout);






export default router;

