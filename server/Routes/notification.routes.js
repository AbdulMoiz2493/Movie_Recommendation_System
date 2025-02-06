import express from "express"
import { verifyUserJWT } from "../Middlewares/auth.middleware.js";
import { getUpcomingMovies, getUserNotifications, updateUserNotifications } from "../Controller/notification.controller.js";

const router = express.Router();

router.get("/upcoming-movies", verifyUserJWT, getUpcomingMovies);
router.post("/notifications", verifyUserJWT, updateUserNotifications);
router.get("/notifications", verifyUserJWT, getUserNotifications);



export default router;