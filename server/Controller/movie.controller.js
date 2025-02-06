import { Movie } from "../Models/movie.model.js";
import { Director } from "../Models/director.model.js";
import { Actor } from "../Models/actor.model.js";
import { User } from "../Models/user.model.js";
import { ErrorHandler } from "../Utils/ApiErrorHandler.js";
import { asyncHandler } from "../Utils/AsyncHandler.js";
import { ApiResponseHandler } from "../Utils/ApiResponseHandler.js";


// Get a list of all movies with optional filtering
export const getAllMovies = asyncHandler(async (req, res) => {
    const { genre, minRating, maxRating, director, cast, releaseYear, page = 1, limit = 10 } = req.query;

    // Build the query object based on provided filters
    const query = {};
    if (genre) query.genre = genre;
    if (minRating || maxRating) {
        query.averageRating = {};
        if (minRating) query.averageRating.$gte = parseFloat(minRating);
        if (maxRating) query.averageRating.$lte = parseFloat(maxRating);
    }
    if (director) query.director = director;
    if (cast) query.cast = { $in: cast.split(",") }; // Assumes cast is a comma-separated list
    if (releaseYear) query.releaseDate = { $regex: `^${releaseYear}` };

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch movies with pagination
    const movies = await Movie.find(query)
        .select("title genre director cast releaseDate runtime synopsis averageRating movieCover")
        .skip(skip)
        .limit(parseInt(limit));

    if (!movies.length) {
        return res.status(404).json(new ApiResponseHandler(404, null, "No movies found matching the criteria."));
    }

    // Get the total count for pagination meta-data
    const totalMovies = await Movie.countDocuments(query);
    const totalPages = Math.ceil(totalMovies / limit);

    res.status(200).json(new ApiResponseHandler(200, {
        movies,
        currentPage: parseInt(page),
        totalPages,
        totalMovies
    }, "Movies retrieved successfully."));
});


// Get detailed information about a specific movie by its ID
export const getMovieById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Fetch movie from the database by ID, including detailed information
    const movie = await Movie.findById(id).populate({
        path: 'cast director',
        select: 'name biography filmography awards photos',
    });

    if (!movie) {
        return res.status(404).json(new ApiResponseHandler(404, null, "Movie not found."));
    }

    res.status(200).json(new ApiResponseHandler(200, movie, "Movie details retrieved successfully."));
});


// Add a new movie to the database (Admin only)
export const addMovie = asyncHandler(async (req, res) => {
    // Check if the user has admin privileges
    if (req.user.role !== 'admin') {
        throw new ErrorHandler(401, "Access denied. Only admins can add movies.");
    }

    const {
        title,
        genre,
        director,
        cast,
        releaseDate,
        runtime,
        synopsis,
        averageRating,
        coverPhoto,
        trivia,
        goofs,
        soundtrack,
        ageRating,
        parentalGuidance,
        boxOffice,
        awards
    } = req.body;

    // Validate required fields
    if (!title || !genre || !director || !cast || !releaseDate || !runtime || !synopsis) {
        throw new ErrorHandler(400, "Please provide all mandatory movie details.");
    }

    // Create a new movie document
    const newMovie = new Movie({
        title,
        genre,
        director,
        cast,
        releaseDate,
        runtime,
        synopsis,
        averageRating: averageRating || 0, // Default average rating to 0 if not provided
        coverPhoto,
        trivia,
        goofs,
        soundtrack,
        ageRating,
        parentalGuidance,
        boxOffice: {
            openingWeekend: boxOffice?.openingWeekend,
            totalEarnings: boxOffice?.totalEarnings,
            internationalRevenue: boxOffice?.internationalRevenue
        },
        awards: awards?.map(award => ({
            awardName: award.awardName,
            year: award.year,
            result: award.result
        }))
    });

    // Save the new movie to the database
    const savedMovie = await newMovie.save();

    if (!savedMovie) {
        throw new ErrorHandler(500, "Failed to save the new movie.");
    }

    res.status(201).json(new ApiResponseHandler(201, savedMovie, "Movie added successfully."));
});



// Update an existing movie's details (Admin only)
export const updateMovie = asyncHandler(async (req, res) => {
    // Check if the user has admin privileges
    if (req.user.role !== 'admin') {
        throw new ErrorHandler(403, "Access denied. Only admins can update movies.");
    }

    const { id } = req.params; // Movie ID from URL
    const updateData = req.body; // Updated movie data from request body

    // Validate that update data is provided
    if (Object.keys(updateData).length === 0) {
        throw new ErrorHandler(400, "No update data provided.");
    }

    // Find the movie by ID and update it
    const updatedMovie = await Movie.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    // Check if the movie was found and updated
    if (!updatedMovie) {
        throw new ErrorHandler(404, "Movie not found or could not be updated.");
    }

    res.status(200).json(new ApiResponseHandler(200, updatedMovie, "Movie updated successfully."));
});




// Delete a movie from the database (Admin only)
export const deleteMovie = asyncHandler(async (req, res) => {
    // Check if the user has admin privileges
    if (req.user.role !== 'admin') {
        throw new ErrorHandler(401, "Access denied. Only admins can delete movies.");
    }

    const { id } = req.params; // Movie ID from URL

    // Find and delete the movie by ID
    const deletedMovie = await Movie.findByIdAndDelete(id);

    // Check if the movie was found and deleted
    if (!deletedMovie) {
        throw new ErrorHandler(404, "Movie not found or could not be deleted.");
    }

    res.status(200).json(new ApiResponseHandler(200, {}, "Movie deleted successfully."));
});



export const getMovieCast = asyncHandler(async (req, res) => {
    const { id } = req.params; // Movie ID from URL

    // Find the movie by ID and populate cast and crew details
    const movie = await Movie.findById(id).populate('cast');

    // Check if the movie exists
    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Check if there is any cast or crew data
    if (!movie.cast.length) {
        return res.status(404).json(new ApiResponseHandler(404, null, "No cast or crew found for this movie."));
    }

    // Return the complete cast and crew without pagination
    res.status(200).json(new ApiResponseHandler(200, {
        cast: movie.cast,
    }, "Cast retrieved successfully."));
});




// Get trivia or interesting facts for a specific movie
export const getMovieTrivia = asyncHandler(async (req, res) => {
    const { id } = req.params; // Movie ID from URL

    // Find the movie by ID and select trivia details
    const movie = await Movie.findById(id).select('title trivia');

    // Check if the movie exists
    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    res.status(200).json(new ApiResponseHandler(200, {
        movieTitle: movie.title,
        trivia: movie.trivia,
    }, "Trivia retrieved successfully."));
});



export const getMovieGoofs = asyncHandler(async (req, res) => {
    const { id } = req.params; // Movie ID from URL
    const { page = 1, limit = 10 } = req.query; // Pagination query parameters

    // Find the movie by ID and select goofs details
    const movie = await Movie.findById(id).select('title goofs');

    // Check if the movie exists
    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Implement pagination for goofs
    const paginatedGoofs = movie.goofs.slice(skip, skip + parseInt(limit));

    // Check if any goofs are returned after pagination
    if (!paginatedGoofs.length) {
        return res.status(404).json(new ApiResponseHandler(404, null, "No goofs found for the given page."));
    }

    res.status(200).json(new ApiResponseHandler(200, {
        movieTitle: movie.title,
        goofs: paginatedGoofs,
        currentPage: parseInt(page),
        limit: parseInt(limit),
        totalGoofs: movie.goofs.length,
        totalPages: Math.ceil(movie.goofs.length / limit),
    }, "Goofs retrieved successfully."));
});



// Get a list of soundtrack information for a specific movie
export const getMovieSoundtrack = asyncHandler(async (req, res) => {
    const { id } = req.params; // Movie ID from URL
    const { page = 1, limit = 10 } = req.query; // Pagination query parameters

    // Find the movie by ID and select soundtrack details
    const movie = await Movie.findById(id).select('title soundtrackInfo');

    // Check if the movie exists
    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Ensure the soundtrack field is an array
    const soundtrackArray = Array.isArray(movie.soundtrackInfo) ? movie.soundtrackInfo : [];

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Implement pagination for soundtrack
    const paginatedSoundtrack = soundtrackArray.slice(skip, skip + parseInt(limit));

    // Check if any soundtrack is returned after pagination
    if (!paginatedSoundtrack.length) {
        return res.status(404).json(new ApiResponseHandler(404, null, "No soundtrack found for the given page."));
    }

    res.status(200).json(new ApiResponseHandler(200, {
        movieTitle: movie.title,
        soundtrack: paginatedSoundtrack,
        currentPage: parseInt(page),
        limit: parseInt(limit),
        totalSoundtrack: soundtrackArray.length,
        totalPages: Math.ceil(soundtrackArray.length / parseInt(limit)),
    }, "Soundtrack information retrieved successfully."));
});




// Get awards and nominations for a specific movie
export const getMovieAwards = asyncHandler(async (req, res) => {
    const { id } = req.params; // Movie ID from URL
    const { page = 1, limit = 10 } = req.query; // Pagination query parameters

    // Find the movie by ID and select awards details
    const movie = await Movie.findById(id).select('title awards');

    // Check if the movie exists
    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Implement pagination for awards
    const paginatedAwards = movie.awards.slice(skip, skip + parseInt(limit));

    // Check if any awards are returned after pagination
    if (!paginatedAwards.length) {
        return res.status(404).json(new ApiResponseHandler(404, null, "No awards found for the given page."));
    }

    res.status(200).json(new ApiResponseHandler(200, {
        movieTitle: movie.title,
        awards: paginatedAwards,
        currentPage: parseInt(page),
        limit: parseInt(limit),
        totalAwards: movie.awards.length,
        totalPages: Math.ceil(movie.awards.length / limit),
    }, "Awards and nominations retrieved successfully."));
});




// Add a review for a specific movie
export const addMovieReview = asyncHandler(async (req, res) => {
    const { id } = req.params; // Movie ID from URL
    const { rating, reviewText } = req.body; // Review data from the request body
    const userId = req.user._id; // ID of the logged-in user

    // Validate the required fields
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        throw new ErrorHandler(400, "Rating must be a number between 1 and 5.");
    }

    if (!reviewText || reviewText.trim().length === 0) {
        throw new ErrorHandler(400, "Review text cannot be empty.");
    }

    // Find the movie by ID
    const movie = await Movie.findById(id);
    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Check if the user has already submitted a review for this movie
    const existingReview = movie.reviews.find(
        (review) => review.user.toString() === userId.toString()
    );

    if (existingReview) {
        throw new ErrorHandler(400, "User has already submitted a review for this movie.");
    }

    // Create a new review object
    const newReview = {
        user: userId,
        rating,
        reviewText,
    };

    // Add the review to the movie's reviews array
    movie.reviews.push(newReview);

    // Recalculate the average rating
    const totalRatings = movie.reviews.reduce((acc, review) => acc + review.rating, 0);
    movie.averageRating = totalRatings / movie.reviews.length;

    // Save the updated movie document
    await movie.save();

    res.status(201).json(new ApiResponseHandler(201, newReview, "Review added successfully."));
});



// Update an existing review for a specific movie
export const updateMovieReview = asyncHandler(async (req, res) => {
    const { id } = req.params; // Movie ID from URL
    const { rating, reviewText } = req.body; // Updated review data
    const userId = req.user._id; // ID of the logged-in user

    // Validate the required fields
    if (rating && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
        throw new ErrorHandler(400, "Rating must be a number between 1 and 5.");
    }

    if (reviewText && reviewText.trim().length === 0) {
        throw new ErrorHandler(400, "Review text cannot be empty.");
    }

    // Find the movie by ID
    const movie = await Movie.findById(id);
    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Find the review by the user
    const review = movie.reviews.find(
        (review) => review.user.toString() === userId.toString()
    );

    if (!review) {
        throw new ErrorHandler(404, "Review not found for this user.");
    }

    // Update the review properties
    if (rating) review.rating = rating;
    if (reviewText) review.reviewText = reviewText;

    // Recalculate the average rating
    const totalRatings = movie.reviews.reduce((acc, review) => acc + review.rating, 0);
    movie.averageRating = totalRatings / movie.reviews.length;

    // Save the updated movie document
    await movie.save();

    res.status(200).json(new ApiResponseHandler(200, review, "Review updated successfully."));
});


// Delete a review from a movie (user or admin)
export const deleteMovieReview = asyncHandler(async (req, res) => {
    const { id } = req.params; // Movie ID from URL
    const userId = req.user._id; // ID of the logged-in user
    const userRole = req.user.role; // Role of the logged-in user

    // Find the movie by ID
    const movie = await Movie.findById(id);
    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Find the review by the user or ensure admin privileges
    const reviewIndex = movie.reviews.findIndex(
        (review) => review.user.toString() === userId.toString()
    );

    if (reviewIndex === -1 && userRole !== 'admin') {
        throw new ErrorHandler(403, "Review not found or insufficient permissions.");
    }

    // If the user is an admin, allow them to delete any review
    if (userRole === 'admin' && reviewIndex === -1) {
        throw new ErrorHandler(404, "Review not found.");
    }

    // Remove the review from the array
    movie.reviews.splice(reviewIndex, 1);

    // Recalculate the average rating
    if (movie.reviews.length > 0) {
        const totalRatings = movie.reviews.reduce((acc, review) => acc + review.rating, 0);
        movie.averageRating = totalRatings / movie.reviews.length;
    } else {
        movie.averageRating = 0; // No reviews left, reset the average rating
    }

    // Save the updated movie document
    await movie.save();

    res.status(200).json(new ApiResponseHandler(200, {}, "Review deleted successfully."));
});


// Get all reviews for a specific movie
export const getMovieReviews = asyncHandler(async (req, res) => {
    const { id } = req.params; // Movie ID from URL
    const { page = 1, limit = 10 } = req.query; // Pagination query parameters

    // Find the movie by ID and populate the reviews with user information
    const movie = await Movie.findById(id).populate({
        path: 'reviews.user',
        select: 'name avatar' // Include the reviewer's name and avatar
    });

    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Paginate reviews
    const paginatedReviews = movie.reviews.slice(skip, skip + parseInt(limit));

    // Check if any reviews are returned after pagination
    if (!paginatedReviews.length) {
        return res.status(404).json(new ApiResponseHandler(404, null, "No reviews found for the given page."));
    }

    // Extract the reviews with user info
    const reviews = paginatedReviews.map((review) => ({
        user: {
            id: review.user._id,
            name: review.user.name,
            avatar: review.user.avatar,
        },
        rating: review.rating,
        comment: review.comment,
        date: review.date,
    }));

    res.status(200).json(new ApiResponseHandler(200, {
        reviews,
        currentPage: parseInt(page),
        limit: parseInt(limit),
        totalReviews: movie.reviews.length,
        totalPages: Math.ceil(movie.reviews.length / limit),
    }, "Reviews retrieved successfully."));
});




// Get the most liked, top-rated reviews for a movie
export const getReviewHighlights = asyncHandler(async (req, res) => {
    const { id } = req.params; // Movie ID from URL

    // Find the movie by ID and populate the reviews with user information
    const movie = await Movie.findById(id).populate({
        path: 'reviews.user',
        select: 'name avatar' // Include the reviewer's name and avatar
    });

    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Sort reviews by rating and likes (assumes a 'likes' field exists in the review schema)
    const topReviews = movie.reviews
        .sort((a, b) => {
            if (b.rating === a.rating) {
                return b.likes - a.likes; // Secondary sort by likes if ratings are equal
            }
            return b.rating - a.rating; // Primary sort by rating
        })
        .slice(0, 5) // Get top 5 reviews

    const highlights = topReviews.map((review) => ({
        user: {
            id: review.user._id,
            name: review.user.name,
            avatar: review.user.avatar,
        },
        rating: review.rating,
        comment: review.comment,
        likes: review.likes,
        date: review.date,
    }));

    res.status(200).json(new ApiResponseHandler(200, highlights, "Review highlights retrieved successfully."));
});


// Get personalized movie recommendations for a user
export const getRecommendations = asyncHandler(async (req, res) => { 
    // Ensure the user is authenticated
    if (!req.user) {
        throw new ErrorHandler(401, "Unauthorized. Please log in to get recommendations.");
    }
    
    // Get the user's preferences and ratings
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ErrorHandler(404, "User not found.");
    }

    // Extract user preferences (e.g., favorite genres)
    const { preferences } = user;

    // Get the list of genres the user likes
    const favoriteGenres = preferences.favoriteGenres;
    if (!favoriteGenres || favoriteGenres.length === 0) {
        return res.status(200).json(new ApiResponseHandler(200, [], "No favorite genres found for recommendations."));
    }
    console.log(favoriteGenres);
    // Find movies based on the user's favorite genres and ensure those movies have reviews
    const recommendedMovies = await Movie.find({
        genre: { $in: favoriteGenres },
        'reviews.user': { $in: user._id }, // Match movie genres to the user's favorites
    })
    .sort({ averageRating: -1 }) // Sort by highest average rating
    .limit(10); // Limit to top 10 recommendations

    if (recommendedMovies.length === 0) {
        return res.status(200).json(new ApiResponseHandler(200, [], "No recommendations available based on your favorite genres."));
    }

    // Return the recommended movies
    res.status(200).json(new ApiResponseHandler(200, recommendedMovies, "Personalized recommendations retrieved successfully."));
});




// Get a list of similar movies to the specified movie
export const getSimilarMovies = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find the movie by ID to get its details
    const movie = await Movie.findById(id);
    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Build a query to find similar movies based on genre, director, and popularity
    const similarMovies = await Movie.find({
        _id: { $ne: movie._id }, // Exclude the current movie
        $or: [
            { genre: { $in: movie.genre } },
            { director: movie.director },
        ]
    }).sort({ popularity: -1 }) // Sort by popularity to prioritize popular movies
    .limit(10); // Limit to top 10 similar movies

    if (similarMovies.length === 0) {
        return res.status(200).json(new ApiResponseHandler(200, [], "No similar movies found."));
    }

    // Return the similar movies
    res.status(200).json(new ApiResponseHandler(200, similarMovies, "Similar movies retrieved successfully."));
});




// Get a list of trending movies based on current user activity
export const getTrendingMovies = asyncHandler(async (req, res) => {
    try {
        // Define the criteria for trending movies
        // This example considers movies with high recent user interactions, like views or ratings
        const trendingMovies = await Movie.find({
            averageRating: { $gt: 3 } // Only include movies with a rating greater than 3
        })
        .limit(10); // Limit to the top 10 trending movies

        if (trendingMovies.length === 0) {
            return res.status(200).json(new ApiResponseHandler(200, [], "No trending movies found."));
        }

        // Return the trending movies
        res.status(200).json(new ApiResponseHandler(200, trendingMovies, "Trending movies retrieved successfully."));
    } catch (error) {
        throw new ErrorHandler(500, "An error occurred while fetching trending movies.");
    }
});


// Get a list of top-rated movies, globally or within a specified time frame
export const getTopRatedMovies = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    try {
        let filter = {};
        
        // If a time frame is specified, filter movies by that time frame
        if (startDate && endDate) {
            filter = {
                releaseDate: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                },
            };
        }

        // Find the top-rated movies, sorted by average rating in descending order
        const topRatedMovies = await Movie.find(filter)
            .sort({ averageRating: -1 }) // Sort by highest average rating
            .limit(10); // Limit to the top 10 movies

        if (topRatedMovies.length === 0) {
            return res.status(200).json(new ApiResponseHandler(200, [], "No top-rated movies found."));
        }

        // Return the top-rated movies
        res.status(200).json(new ApiResponseHandler(200, topRatedMovies, "Top-rated movies retrieved successfully."));
    } catch (error) {
        throw new ErrorHandler(500, "An error occurred while fetching top-rated movies.");
    }
});




// Search for movies by title, genre, director, or actor
export const searchMovies = asyncHandler(async (req, res) => {
    const { title, genre, director, actor } = req.query;

    try {
        // Build the search query object based on provided query parameters
        const searchCriteria = {};

        if (title) {
            searchCriteria.title = { $regex: title, $options: 'i' }; // Case-insensitive regex search
        }
        if (genre) {
            searchCriteria.genre = { $regex: genre, $options: 'i' };
        }
        if (req.query.director) {
            const director = await Director.findOne({ name: req.query.director });
            if (director) searchCriteria.director = director._id;
        }
        
        if (req.query.actor) {
            const actor = await Actor.findOne({ name: req.query.actor });
            if (actor) searchCriteria.cast = { $in: [actor._id] };
        }

        // Find movies based on the search criteria
        const movies = await Movie.find(searchCriteria).select('title genre director cast releaseDate').populate('director cast');

        if (movies.length === 0) {
            return res.status(404).json(new ApiResponseHandler(404, null, "No movies found matching the criteria."));
        }

        // Return the search results
        res.status(200).json(new ApiResponseHandler(200, movies, "Movies found successfully."));
    } catch (error) {
        throw new ErrorHandler(500, error.stack);
    }
});




// Advanced filtering for movies by decade, ageRating etc.
export const advancedFilterMovies = asyncHandler(async (req, res) => {
    const { decade, ageRating } = req.query;

    try {
        // Build the filter query object based on provided query parameters
        const filterCriteria = {};

        // Filter by decade (e.g., "1990s" filters from 1990 to 1999)
        if (decade) {
            const startYear = parseInt(decade, 10);
            if (!isNaN(startYear)) {
                filterCriteria.releaseDate = {
                    $gte: new Date(`${startYear}-01-01`),
                    $lt: new Date(`${startYear + 10}-01-01`),
                };
            }
        }

        // Filter by country of origin
        if (ageRating) {
            filterCriteria.ageRating = { $regex: new RegExp(ageRating, 'i') };
        }

        // Find movies based on the filter criteria
        const movies = await Movie.find(filterCriteria).select('title releaseDate countryOfOrigin language');

        if (movies.length === 0) {
            return res.status(404).json(new ApiResponseHandler(404, null, "No movies found matching the criteria."));
        }

        // Return the filtered results
        res.status(200).json(new ApiResponseHandler(200, movies, "Movies filtered successfully."));
    } catch (error) {
        throw new ErrorHandler(500, "An error occurred while filtering movies.");
    }
});




// Get the top movies of the current month
export const getTopMoviesOfMonth = asyncHandler(async (req, res) => {
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1); // Set to the first day of the current month
    currentMonthStart.setHours(0, 0, 0, 0); // Set time to midnight

    const currentMonthEnd = new Date(currentMonthStart);
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1); // Move to the next month
    currentMonthEnd.setDate(0); // Set to the last day of the current month
    currentMonthEnd.setHours(23, 59, 59, 999); // Set time to the end of the last day

    try {
        // Find movies that have been rated in the current month and sort by rating (or any other criteria)
        const topMovies = await Movie.find({
            releaseDate: { $gte: currentMonthStart, $lt: currentMonthEnd },
        })
            .sort({ rating: -1 }) // Sort by rating (change criteria if needed)
            .limit(10) // Limit to top 10 movies of the month (adjust as needed)
            .select('title releaseDate rating');

        if (topMovies.length === 0) {
            return res.status(404).json(new ApiResponseHandler(404, null, "No movies found for the current month."));
        }

        res.status(200).json(new ApiResponseHandler(200, topMovies, "Top movies of the month fetched successfully."));
    } catch (error) {
        throw new ErrorHandler(500, "An error occurred while fetching top movies of the month.");
    }
});




// Get the top 10 movies by genre
export const getTopMoviesByGenre = asyncHandler(async (req, res) => {
    const { genre } = req.query; // Get genre from query parameters

    if (!genre) {
        throw new ErrorHandler(400, "Genre parameter is required.");
    }

    try {
        // Find movies that match the genre and sort by rating (or any other criteria)
        const topMovies = await Movie.find({ genre: { $in: [genre] } })
            .sort({ rating: -1 }) // Sort by rating (change criteria if needed)
            .limit(10) // Limit to top 10 movies in the genre
            .select('title genre rating releaseDate'); // Select necessary fields

        if (topMovies.length === 0) {
            return res.status(404).json(new ApiResponseHandler(404, null, "No movies found for this genre."));
        }

        res.status(200).json(new ApiResponseHandler(200, topMovies, `Top 10 movies in the ${genre} genre fetched successfully.`));
    } catch (error) {
        throw new ErrorHandler(500, "An error occurred while fetching top movies by genre.");
    }
});




// Get box office information for a specific movie
export const getBoxOfficeInfo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find the movie by its ID
    const movie = await Movie.findById(id);

    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Assuming 'boxOffice' is a field in your movie schema containing box office data
    const { openingWeekend, totalEarnings, internationalRevenue } = movie.boxOffice;

    if (!openingWeekend || !totalEarnings || !internationalRevenue) {
        throw new ErrorHandler(404, "Box office information not available for this movie.");
    }

    res.status(200).json(
        new ApiResponseHandler(200, {
            openingWeekend,
            totalEarnings,
            internationalRevenue,
        }, "Box office information retrieved successfully.")
    );
});



// Get awards and nominations for a specific movie
export const getAwardsInfo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find the movie by its ID
    const movie = await Movie.findById(id);

    if (!movie) {
        throw new ErrorHandler(404, "Movie not found.");
    }

    // Assuming 'awards' is a field in your movie schema containing awards and nominations data
    const awards = movie.awards;

    if (!awards || awards.length === 0) {
        throw new ErrorHandler(404, "Awards information not available for this movie.");
    }

    res.status(200).json(
        new ApiResponseHandler(200, awards, "Awards information retrieved successfully.")
    );
});



export const getAverageRating =  asyncHandler(async (req, res) => {
    const {id} = req.params;

    if(!id) {
        throw new ErrorHandler(404, "Please provide movie id in the url");
    };

    const movie = await Movie.findById(id);
    
    if(movie.reviews.length <= 0) {
        throw new ErrorHandler(404, "No reviews found for this movie");
    }

    // Calculate the sum of all ratings
    const sumOfRating = movie.reviews.reduce((sum, review) => {
        return sum + (typeof review?.rating === 'number' ? review.rating : 0);
    }, 0);

    const averageRating = sumOfRating / movie.reviews.length;


    res.status(200).json(
        new ApiResponseHandler(200, averageRating, "Average Rating calculated successfully")
    );

});



// Get the top 3 rated reviews for a specific movie
export const getTopRatedReviews = asyncHandler(async (req, res) => {
    const { id } = req.params; // Movie ID from URL
  
    // Find the movie by ID and populate the reviews with user information
    const movie = await Movie.findById(id).populate({
      path: 'reviews.user',
      select: 'name avatar', // Include the reviewer's name and avatar
    });
  
    if (!movie) {
      throw new ErrorHandler(404, "Movie not found.");
    }
  
    // Sort reviews by rating in descending order and limit to the top 3
    const topRatedReviews = movie.reviews
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  
    // Check if any top-rated reviews are found
    if (!topRatedReviews.length) {
      return res.status(404).json(new ApiResponseHandler(404, null, "No reviews found for this movie."));
    }
  
    // Extract the reviews with user info
    const reviews = topRatedReviews.map((review) => ({
      user: {
        id: review.user._id,
        name: review.user.name,
        avatar: review.user.avatar,
      },
      rating: review.rating,
      reviewText: review.reviewText,
      createdAt: review.createdAt,
    }));
  
    res.status(200).json(new ApiResponseHandler(200, reviews, "Top-rated reviews fetched successfully."));
  });
  