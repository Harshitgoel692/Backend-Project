import { Router } from "express";
import { validToken } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controllers.js";

const router = Router();
router.use(validToken);

router.route("/c/:channelId").post(toggleSubscription).get(getUserChannelSubscribers);
router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router