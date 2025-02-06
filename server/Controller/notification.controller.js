import { Movie } from "../Models/movie.model.js";
import { User } from "../Models/user.model.js";
import { ErrorHandler } from "../Utils/ApiErrorHandler.js";
import { asyncHandler } from "../Utils/AsyncHandler.js";
import { ApiResponseHandler } from "../Utils/ApiResponseHandler.js";

// Get a list of upcoming movies with release dates
export const getUpcomingMovies = asyncHandler(async (req, res) => {
    try {
        // Find movies that are scheduled for future release (release date is in the future)
        const upcomingMovies = await Movie.find({ releaseDate: { $gte: new Date() } })
            .sort({ releaseDate: 1 }) // Sort by release date in ascending order (soonest first)
            .select('title genre releaseDate director cast') // Select necessary fields
            .limit(10); // Limit to a specific number, you can adjust this as needed

        if (upcomingMovies.length === 0) {
            return res.status(404).json(new ApiResponseHandler(404, null, "No upcoming movies found."));
        }

        res.status(200).json(new ApiResponseHandler(200, upcomingMovies, "Upcoming movies fetched successfully."));
    } catch (error) {
        throw new ErrorHandler(500, "An error occurred while fetching upcoming movies.");
    }
});





// Enable or disable notifications for upcoming releases or trailers based on user preferences
export const updateUserNotifications = asyncHandler(async (req, res) => {
    const { notificationsEnabled } = req.body;

    if (typeof notificationsEnabled !== 'boolean') {
        throw new ErrorHandler(400, "Invalid input. 'notificationsEnabled' must be a boolean.");
    }

    try {
        // Update the user's notification preference in the database
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id, // The logged-in user's ID
            { notificationsEnabled }, // Update the notification preference
            { new: true, runValidators: true } // Return the updated user and validate the update
        );

        if (!updatedUser) {
            throw new ErrorHandler(404, "User not found.");
        }

        res.status(200).json(new ApiResponseHandler(200, updatedUser, "User notification preferences updated successfully."));
    } catch (error) {
        throw new ErrorHandler(500, "An error occurred while updating user notification preferences.");
    }
});




export const getUserNotifications = asyncHandler(async (req, res) => {
    try {
      // Step 1: Find upcoming movies (movies with a future release date)
      const upcomingMovies = await Movie.find({ releaseDate: { $gt: new Date() } }).select("title releaseDate");
  
      // Step 2: Find the currently logged-in user
      const user = await User.findById(req.user._id);
  
      if (!user) {
        throw new ErrorHandler(404, "User not found.");
      }
  
      // Step 3: Add notifications for upcoming movies if the user has notifications enabled
      if (user.notificationsEnabled && upcomingMovies.length > 0) {
        upcomingMovies.forEach(movie => {
          const notificationMessage = `Upcoming Movie: ${movie.title}, Release Date: ${movie.releaseDate.toDateString()}`;
          user.notifications.push({ message: notificationMessage });
        });
  
        // Save the user to update the notifications in the database
        await user.save();
      }
  
      // Step 4: Fetch all notifications to send in the response
      const userNotifications = user.notifications;
  
      res.status(200).json(new ApiResponseHandler(200, userNotifications, "User notifications updated and fetched successfully."));
    } catch (error) {
      throw new ErrorHandler(500, "An error occurred while processing notifications.");
    }
  });