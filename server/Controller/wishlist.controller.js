import { User } from "../Models/user.model.js";
import { Movie } from "../Models/movie.model.js";
import { ErrorHandler } from "../Utils/ApiErrorHandler.js";
import { asyncHandler } from "../Utils/AsyncHandler.js";
import { ApiResponseHandler } from "../Utils/ApiResponseHandler.js";


// Add a movie to the logged-in user's wishlist
export const addToWishlist = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Get the logged-in user's ID from the request
    const { movieId } = req.body; // Get the movie ID from the request body

    if (!movieId) {
        throw new ErrorHandler(400, "Movie ID is required to add to wishlist.");
    }

    try {
        // Find the user by their ID
        const user = await User.findById(userId);
        const movieExistsOrNot = await Movie.findById(movieId);
        if (!user) {
            throw new ErrorHandler(404, "User not found.");
        }

        if(!movieExistsOrNot) {
            throw new ErrorHandler(404, "Movie not found.");
        }

        // Check if the movie is already in the wishlist
        if (user.wishlist.includes(movieId)) {
            return res.status(400).json(new ApiResponseHandler(400, null, "Movie is already in your wishlist."));
        }

        // Add the movie ID to the user's wishlist
        user.wishlist.push(movieId);
        await user.save();

        // Return a success response
        res.status(200).json(new ApiResponseHandler(200, user.wishlist, "Movie added to wishlist successfully."));
    } catch (error) {
        throw new ErrorHandler(500, error.stack);
    }
});


// Remove a movie from the logged-in user's wishlist
export const removeFromWishlist = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Get the logged-in user's ID from the request
    const { movieId } = req.body; // Get the movie ID from the request body

    if (!movieId) {
        throw new ErrorHandler(400, "Movie ID is required to remove from wishlist.");
    }

    try {
        // Find the user by their ID
        const user = await User.findById(userId);

        if (!user) {
            throw new ErrorHandler(404, "User not found.");
        }

        // Check if the movie exists in the user's wishlist
        const movieIndex = user.wishlist.indexOf(movieId);
        if (movieIndex === -1) {
            return res.status(400).json(new ApiResponseHandler(400, null, "Movie not found in your wishlist."));
        }

        // Remove the movie ID from the wishlist
        user.wishlist.splice(movieIndex, 1);
        await user.save();

        // Return a success response
        res.status(200).json(new ApiResponseHandler(200, user.wishlist, "Movie removed from wishlist successfully."));
    } catch (error) {
        throw new ErrorHandler(500, "An error occurred while removing the movie from the wishlist.");
    }
});



// Get the logged-in user's wishlist
export const getUserWishlist = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Get the logged-in user's ID from the request
    const { page = 1, limit = 10 } = req.query; // Pagination parameters (default: page 1, limit 10)

    // Calculate the skip value based on the page and limit
    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
        // Find the user by their ID and paginate the wishlist with movie details
        const user = await User.findById(userId)
            .populate({
                path: 'wishlist',
                select: 'title genre director releaseDate coverPhoto',
            })
            .skip(skip) // Skip the appropriate number of wishlist items
            .limit(parseInt(limit)); // Limit the number of movies in the wishlist returned

        if (!user) {
            throw new ErrorHandler(404, "User not found.");
        }

        // Get the total count of wishlist items to calculate total pages
        const totalwishlistItems = user.wishlist.length;

        // Return the user's wishlist with pagination metadata
        res.status(200).json(new ApiResponseHandler(200, {
            wishlist: user.wishlist,
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalwishlistItems,
            totalPages: Math.ceil(totalwishlistItems / limit),
        }, "User's wishlist retrieved successfully."));
    } catch (error) {
        throw new ErrorHandler(500, "An error occurred while retrieving the wishlist.");
    }
});





// Create a custom list for the logged-in user
export const createCustomList = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Get the logged-in user's ID from the request
    const { title, description, movies } = req.body; // Destructure request body

    // Validate required fields
    if (!title || !movies || !Array.isArray(movies)) {
        throw new ErrorHandler(400, "Please provide a list name and an array of movie IDs.");
    }

    try {
        // Check if a list with the same name already exists for the user
        const existingList = await User.findOne({
            _id: userId,
            'customLists.title': title,
        });

        if (existingList) {
            throw new ErrorHandler(409, "A list with this name already exists.");
        }

        // Create a new custom list object
        const newList = {
            title,
            description: description || '',
            movies,
        };

        // Add the new list to the user's custom lists array
        const user = await User.findByIdAndUpdate(
            userId,
            { $push: { customLists: newList } },
            { new: true, runValidators: true }
        ).populate({
            path: 'customLists.movies',
            select: 'title genre director coverPhoto',
        });

        if (!user) {
            throw new ErrorHandler(404, "User not found.");
        }

        // Return the newly created custom list
        const createdList = user.customLists.find(list => list.title === title);
        res.status(201).json(new ApiResponseHandler(201, createdList, "Custom list created successfully."));
    } catch (error) {
        throw new ErrorHandler(500, error.message);
    }
});



// Get the logged-in user's custom lists
export const getCustomLists = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Get the logged-in user's ID from the request
    const { page = 1, limit = 10 } = req.query; // Pagination parameters (default: page 1, limit 10)

    try {
        // Find the user and select custom lists
        const user = await User.findById(userId).select('customLists');

        if (!user) {
            throw new ErrorHandler(404, "User not found.");
        }

        // Get total number of custom lists
        const totalLists = user.customLists.length;

        // Paginate custom lists
        const paginatedLists = user.customLists.slice(
            (page - 1) * limit,
            page * limit
        );

        // Populate movie details for the paginated custom lists
        await User.populate(paginatedLists, {
            path: 'movies',
            select: 'title genre director coverPhoto',
        });

        // Return paginated custom lists with metadata
        res.status(200).json(new ApiResponseHandler(200, {
            customLists: paginatedLists,
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalLists,
            totalPages: Math.ceil(totalLists / limit),
        }, "Custom lists retrieved successfully."));
    } catch (error) {
        throw new ErrorHandler(500, "An error occurred while retrieving the custom lists.");
    }
});


