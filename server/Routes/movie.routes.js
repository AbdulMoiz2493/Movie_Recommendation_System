import express from "express"
import { verifyUserJWT } from "../Middlewares/auth.middleware.js";
import { addMovie, addMovieReview, advancedFilterMovies, deleteMovie, deleteMovieReview, getAllMovies, getAverageRating, getAwardsInfo, getBoxOfficeInfo, getMovieById, getMovieCast, getMovieGoofs, getMovieReviews, getMovieSoundtrack, getMovieTrivia, getRecommendations, getReviewHighlights, getSimilarMovies, getTopMoviesByGenre, getTopMoviesOfMonth, getTopRatedMovies, getTopRatedReviews, getTrendingMovies, searchMovies, updateMovie, updateMovieReview } from "../Controller/movie.controller.js";

const router = express.Router();


//Recommendations - Trending - Top Rated: 
router.get("/recommendation", verifyUserJWT, getRecommendations);
router.get("/similar/:id", verifyUserJWT, getSimilarMovies);
router.get("/trending", verifyUserJWT, getTrendingMovies);
router.get("/top-rated", verifyUserJWT, getTopRatedMovies);

//Search and Advanced Filtering
router.get("/search", verifyUserJWT, searchMovies);
router.get("/advanced-filter", verifyUserJWT, advancedFilterMovies);
router.get("/top-month", verifyUserJWT, getTopMoviesOfMonth);
router.get("/top-genre", verifyUserJWT, getTopMoviesByGenre);


//Box-office and awards
router.get("/box-office/:id", verifyUserJWT, getBoxOfficeInfo);
router.get("/awards/:id", verifyUserJWT, getAwardsInfo);


//ADMIN OPERATIONS
router.get("/", verifyUserJWT, getAllMovies);
router.get("/:id", verifyUserJWT, getMovieById);
router.post("/", verifyUserJWT, addMovie);
router.put("/:id", verifyUserJWT, updateMovie);
router.delete("/:id", verifyUserJWT, deleteMovie);
router.get("/cast/:id", verifyUserJWT, getMovieCast);
router.get("/trivia/:id", verifyUserJWT, getMovieTrivia);
router.get("/goofs/:id", verifyUserJWT, getMovieGoofs);
router.get("/soundtracks/:id", verifyUserJWT, getMovieSoundtrack);

//Review and Rating
router.post("/reviews/:id", verifyUserJWT, addMovieReview);
router.put("/reviews/:id", verifyUserJWT, updateMovieReview);
router.delete("/reviews/:id", verifyUserJWT, deleteMovieReview);
router.get("/reviews/:id", verifyUserJWT, getMovieReviews);
router.get("/reviews/highlights", verifyUserJWT, getReviewHighlights);
router.get("/reviews/averageRating/:id", verifyUserJWT, getAverageRating);
router.get("/reviews/top-rated/:id", verifyUserJWT, getTopRatedReviews);






export default router;





