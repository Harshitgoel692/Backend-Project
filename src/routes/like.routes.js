import { Router } from "express";
import { validToken } from "../middlewares/auth.middleware.js";
import { getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controllers.js";


const router = Router()
router.use(validToken);

router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("/toggle/c/:commentId").post(toggleCommentLike)
router.route("/toggle/c/:tweetId").post(toggleTweetLike)
router.route("/likedVideos").get(getLikedVideos)


export default router