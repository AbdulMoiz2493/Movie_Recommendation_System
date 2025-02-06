import express from "express"
import { verifyUserJWT } from "../Middlewares/auth.middleware.js";
import { createCommunity, createPostInCommunity, getAllCommunities, getAllPostsInCommunity, getAllReplies, getCommunityById, replyToPost } from "../Controller/communities.controller.js";

const router = express.Router();


router.post("/", verifyUserJWT, createCommunity);
router.get("/", verifyUserJWT, getAllCommunities);
router.get("/:id", verifyUserJWT, getCommunityById);
router.post("/posts/:id", verifyUserJWT, createPostInCommunity);
router.get("/posts/:id", verifyUserJWT, getAllPostsInCommunity);
router.post("/posts/replies", verifyUserJWT, replyToPost);
router.get("/posts/replies", verifyUserJWT, getAllReplies);






export default router;