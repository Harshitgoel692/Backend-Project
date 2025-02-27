import { Router } from "express";
import { validToken } from "../middlewares/auth.middleware.js";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controllers.js";
const router = Router()
router.use(validToken);

router.route("/stats").get(getChannelStats);
router.route("/channel-videos").get(getChannelVideos);

export default router;