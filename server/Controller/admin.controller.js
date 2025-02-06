import { Community } from "../Models/community.model.js";
import { User } from "../Models/user.model.js";
import { Actor } from "../Models/actor.model.js";
import { Director } from "../Models/director.model.js";
import { Movie } from "../Models/movie.model.js";
import { ErrorHandler } from "../Utils/ApiErrorHandler.js";
import { asyncHandler } from "../Utils/AsyncHandler.js";
import { ApiResponseHandler } from "../Utils/ApiResponseHandler.js";

// Get site statistics for admin
export const getSiteStats = asyncHandler(async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      throw new ErrorHandler(401, "Only admin can access this route");
    }

    // Get most popular movies by average rating
    const popularMovies = await Movie.find()
      .sort({ averageRating: -1 })
      .limit(5);

    // Get user activity statistics (total users, recent sign-ups)
    const totalUsers = await User.countDocuments();
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);

    // Get movies with the most reviews
    const topReviewedMovies = await Movie.find()
      .sort({ "reviews.length": -1 })
      .limit(5);

    // Get the most active community discussions by post count
    const activeCommunities = await Community.find()
      .sort({ "posts.length": -1 })
      .limit(5);

    // Construct the response using ApiResponseHandler
    res.status(200).json(
      new ApiResponseHandler(
        200,
        {
          popularMovies,
          totalUsers,
          recentUsers,
          topReviewedMovies,
          activeCommunities,
        },
        "Site statistics fetched successfully."
      )
    );
  } catch (error) {
    throw new ErrorHandler(
      500,
      error.message
    );
  }
});

export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      throw new ErrorHandler(401, "Only admin can access this route");
    }

    // Retrieve a list of all users with selected fields
    const users = await User.find().select("name email role createdAt avatar"); // Adjust fields as necessary

    if (users.length === 0) {
      return res
        .status(404)
        .json(new ApiResponseHandler(404, null, "No users found."));
    }

    res
      .status(200)
      .json(new ApiResponseHandler(200, users, "Users fetched successfully."));
  } catch (error) {
    throw new ErrorHandler(500, "An error occurred while fetching users.");
  }
});



// Delete User Account (for admins)
export const deleteUserAccount = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if(req.user.role !== 'admin'){
        throw new ErrorHandler(401, "Only admin can delete this user");
    }
    // Check if the user exists
    const user = await User.findById(id);
    if (!user) {
        throw new ErrorHandler(404, "User not found");
    }

    // Delete user account
    await User.findByIdAndDelete(id);

    res.status(200).json(new ApiResponseHandler(200, {}, "User account deleted successfully"));
});




// Admin: Update movie details
export const updateMovieDetails = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
  
      // Find and update the movie by ID, return the updated document
      const updatedMovie = await Movie.findByIdAndUpdate(id, updatedData, {
        new: true, // Return the updated document
        runValidators: true, // Ensure validation rules are followed
      });
  
      if (!updatedMovie) {
        return res.status(404).json(new ApiResponseHandler(404, null, "Movie not found."));
      }
  
      res.status(200).json(new ApiResponseHandler(200, updatedMovie, "Movie details updated successfully."));
    } catch (error) {
      throw new ErrorHandler(500, "An error occurred while updating movie details.");
    }
  });


  // Admin: Delete a movie
export const deleteMovie = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find and delete the movie by ID
      const deletedMovie = await Movie.findByIdAndDelete(id);
  
      if (!deletedMovie) {
        return res.status(404).json(new ApiResponseHandler(404, null, "Movie not found."));
      }
  
      res.status(200).json(new ApiResponseHandler(200, null, "Movie deleted successfully."));
    } catch (error) {
      throw new ErrorHandler(500, "An error occurred while deleting the movie.");
    }
});




// Add an actor (only for admin)
export const addActors = asyncHandler(async (req, res) => {
  const user = req.user; // The user information should be set in verifyUserJWT middleware

  // Check if the user is an admin
  if (!user || user.role !== 'admin') {
      throw new ErrorHandler(403, "You are not authorized to perform this action.");
  }

  const { name, biography, filmography, awards, photos } = req.body;

  // Validate required fields
  if (!name) {
      throw new ErrorHandler(400, "Actor name is required.");
  }

  // Create a new actor document
  const actor = new Actor({
      name,
      biography,
      filmography,
      awards,
      photos,
  });

  // Save the actor to the database
  await actor.save();

  // Send success response
  res.status(201).json(new ApiResponseHandler(201, actor, "Actor added successfully."));
});




// Add a director (only for admin)
export const addDirectors = asyncHandler(async (req, res) => {
  const user = req.user; // The user information should be set in verifyUserJWT middleware

  // Check if the user is an admin
  if (!user || user.role !== 'admin') {
      throw new ErrorHandler(403, "You are not authorized to perform this action.");
  }

  const { name, biography, filmography, awards, photos } = req.body;

  // Validate required fields
  if (!name) {
      throw new ErrorHandler(400, "Director name is required.");
  }

  // Create a new director document
  const director = new Director({
      name,
      biography,
      filmography,
      awards,
      photos,
  });

  // Save the director to the database
  await director.save();

  // Send success response
  res.status(201).json(new ApiResponseHandler(201, director, "Director added successfully."));
});