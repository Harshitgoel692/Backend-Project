import { Router } from "express";
import { avatarUpdate, changeUserPassword, coverImageUpdate, getCurrentUser, getUserChannel, getWatchHistory, loginUser, logOutUser, refreshAccessToken, registerUser, updateAccount } from "../controllers/user.controllers.js";
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
router.route("/change-password").post(validToken, changeUserPassword)
router.route("/get-user").get(validToken, getCurrentUser)
router.route("/update-account").patch(validToken, updateAccount)
router.route("/avatar-update").patch(validToken, upload.single("avatar"), avatarUpdate)
router.route("/coverImage-update").patch(validToken, upload.single("coverImage"), coverImageUpdate)
router.route("/channel/:username").get(validToken, getUserChannel)
router.route("/watch-Histroy").get(validToken, getWatchHistory)
export default router