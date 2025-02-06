import { Community } from "../Models/community.model.js"
import { ErrorHandler } from "../Utils/ApiErrorHandler.js";
import { asyncHandler } from "../Utils/AsyncHandler.js";
import { ApiResponseHandler } from "../Utils/ApiResponseHandler.js";



// Create a new community
export const createCommunity = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // Check if title is provided
    if (!title) {
        throw new ErrorHandler(400, "Title is required.");
    }

    // Create a new community
    const community = new Community({
        title,
        description,
        createdBy: req.user._id,  // Assuming user is authenticated and user details are available in req.user
    });

    // Save the community to the database
    await community.save();

    // Send success response
    res.status(201).json(
        new ApiResponseHandler(201, community, "Community created successfully.")
    );
});


// Get a list of all communities
export const getAllCommunities = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Pagination parameters (default: page 1, limit 10)

    // Calculate the skip value based on the page and limit
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch communities with pagination, sorting by creation date (most recent first)
    const communities = await Community.find()
        .populate("createdBy", "name avatar")  // Populate createdBy field with user's name and avatar
        .sort({ createdAt: -1 })  // Sort by creation date, descending (most recent first)
        .skip(skip)  // Skip the appropriate number of documents
        .limit(parseInt(limit));  // Limit the number of documents returned

    // If no communities are found, throw an error
    if (!communities || communities.length === 0) {
        throw new ErrorHandler(404, "No communities found.");
    }

    // Get the total count of communities to calculate total pages
    const totalCommunities = await Community.countDocuments();

    // Send success response with pagination metadata
    res.status(200).json(
        new ApiResponseHandler(200, {
            communities,
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalCommunities,
            totalPages: Math.ceil(totalCommunities / limit),
        }, "Communities fetched successfully.")
    );
});




// Get a specific community discussion board by ID
export const getCommunityById = asyncHandler(async (req, res) => {
    const { id } = req.params; // Get the community ID from the request parameters

    // Fetch the community by its ID and populate related fields (e.g., createdBy, posts, etc.)
    const community = await Community.findById(id)
        .populate("createdBy", "name avatar")  // Populate the creator's details (optional)
        .populate("posts.user", "name avatar") // Populate each post's user details (optional)
        .populate("posts.replies.user", "name avatar") // Populate reply user's details (optional)
        .sort({ "posts.createdAt": -1 });  // Sort posts by their creation date, descending (optional)

    // If no community is found, throw an error
    if (!community) {
        throw new ErrorHandler(404, "Community not found.");
    }

    // Send success response with the community details
    res.status(200).json(
        new ApiResponseHandler(200, community, "Community fetched successfully.")
    );
});


// Create a new post within a community discussion board
export const createPostInCommunity = asyncHandler(async (req, res) => {
    const { id } = req.params; // Get the community ID from request parameters
    const { text } = req.body; // Get the post text from request body

    // Ensure the text is provided
    if (!text) {
        throw new ErrorHandler(400, "Post text is required.");
    }

    // Find the community by ID
    const community = await Community.findById(id);

    // If the community doesn't exist, throw an error
    if (!community) {
        throw new ErrorHandler(404, "Community not found.");
    }

    // Create a new post object
    const newPost = {
        user: req.user._id, // The ID of the user creating the post
        text,
    };

    // Push the new post into the community's posts array
    community.posts.push(newPost);

    // Save the community with the new post added
    await community.save();

    // Send success response with the updated community
    res.status(201).json(
        new ApiResponseHandler(201, community, "Post created successfully.")
    );
});



export const getAllPostsInCommunity = asyncHandler(async (req, res) => {
    const { id } = req.params; // Get the community ID from request parameters
    const { page = 1, limit = 10 } = req.query; // Pagination parameters (default: page 1, limit 10)

    // Calculate the skip value based on the page and limit
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find the community by ID and paginate the posts
    const community = await Community.findById(id)
        .populate('posts.user', 'name avatar') // Populate user details for each post
        .sort({ 'posts.createdAt': -1 })  // Sort posts by creation date, descending (most recent first)
        .skip(skip)  // Skip the appropriate number of posts
        .limit(parseInt(limit));  // Limit the number of posts returned

    // If the community doesn't exist, throw an error
    if (!community) {
        throw new ErrorHandler(404, "Community not found.");
    }

    // Get the total count of posts to calculate total pages
    const totalPosts = community.posts.length;

    // Send success response with pagination metadata
    res.status(200).json(
        new ApiResponseHandler(200, {
            posts: community.posts,
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalPosts,
            totalPages: Math.ceil(totalPosts / limit),
        }, "Posts retrieved successfully.")
    );
});




// Reply to a post in a community discussion board
export const replyToPost = asyncHandler(async (req, res) => {
    const { communityId, postId } = req.params; // Get communityId and postId from request parameters
    const { text } = req.body; // Get the reply text from the request body
    const userId = req.user._id; // Get the logged-in user's ID (from auth middleware)

    // Check if the community exists
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ErrorHandler(404, "Community not found.");
    }

    // Find the post within the community
    const post = community.posts.id(postId); // Find the specific post by ID
    if (!post) {
        throw new ErrorHandler(404, "Post not found.");
    }

    // Create a new reply
    const reply = {
        user: userId,
        text: text,
        createdAt: Date.now(),
    };

    // Add the reply to the post's replies array
    post.replies.push(reply);

    // Save the updated community document
    await community.save();

    // Return the updated post with the new reply
    res.status(200).json(
        new ApiResponseHandler(200, post, "Reply added successfully.")
    );
});






// Get all replies to a specific post within a community
export const getAllReplies = asyncHandler(async (req, res) => {
    const { communityId, postId } = req.params; // Get communityId and postId from request parameters

    // Check if the community exists
    const community = await Community.findById(communityId);
    if (!community) {
        throw new ErrorHandler(404, "Community not found.");
    }

    // Find the post within the community
    const post = community.posts.id(postId); // Find the specific post by ID
    if (!post) {
        throw new ErrorHandler(404, "Post not found.");
    }

    // Return all replies for the post
    res.status(200).json(
        new ApiResponseHandler(200, post.replies, "Replies fetched successfully.")
    );
});
