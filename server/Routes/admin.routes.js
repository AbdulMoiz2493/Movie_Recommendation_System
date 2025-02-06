import express from "express"
import { verifyUserJWT } from "../Middlewares/auth.middleware.js";
import { addActors, addDirectors, deleteMovie, deleteUserAccount, getAllUsers, getSiteStats, updateMovieDetails } from "../Controller/admin.controller.js";

const router = express.Router();

router.get("/stats", verifyUserJWT, getSiteStats);
router.get("/users", verifyUserJWT, getAllUsers);
router.delete("users/:id", verifyUserJWT, deleteUserAccount);
router.put("/movies/:id", verifyUserJWT, updateMovieDetails)
router.delete("/movies/:id", verifyUserJWT, deleteMovie)
router.post("/addActors", verifyUserJWT, addActors);
router.post("/addDirectors", verifyUserJWT, addDirectors);



export default router;
