import {Router} from 'express'
import { changeCurrentPassword, getUser, login, logout, refreshAccessToken, registerUser, updateAccountDetails } from '../controllers/user.controller.js';
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


// Secured Routes;

router.route("/logout").post(verifyJWT,logout);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentPassword);
router.route("/get").get(verifyJWT,getUser);
router.route("/update-info").post(verifyJWT,updateAccountDetails);


export default router;

