import { Router } from "express";
import { loginUser, logOutUser, refreshAccessToken, registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { validToken } from "../middlewares/auth.middleware.js";



const router= Router()

// Register route
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser)

// Login route
router.route("/login").post(loginUser)

// Secured Routes
router.route("/logout").post(validToken, logOutUser )
router.route("/refresh-token").post(refreshAccessToken )

export default router