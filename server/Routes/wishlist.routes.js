import express from "express";
import { verifyUserJWT } from "../Middlewares/auth.middleware.js";
import { addToWishlist, removeFromWishlist, getUserWishlist, createCustomList, getCustomLists } from "../Controller/wishlist.controller.js";


const router = express.Router();

router.post("/custom-list", verifyUserJWT, createCustomList);
router.get("/custom-list", verifyUserJWT, getCustomLists);
router.post("/", verifyUserJWT, addToWishlist);
router.get("/", verifyUserJWT, getUserWishlist);
router.delete("/", verifyUserJWT, removeFromWishlist);








export default router;