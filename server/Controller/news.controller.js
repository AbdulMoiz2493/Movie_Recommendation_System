import { News } from "../Models/news.model.js"
import { ErrorHandler } from "../Utils/ApiErrorHandler.js";
import { asyncHandler } from "../Utils/AsyncHandler.js";
import { ApiResponseHandler } from "../Utils/ApiResponseHandler.js";

// Create a new news or article
export const createNews = asyncHandler(async (req, res) => {
  const { title, content, author, publishedDate } = req.body;

  const news = new News({
    title,
    content,
    author,
    publishedDate,
  });

  const createdNews = await news.save();
  res.status(201).json(new ApiResponseHandler(201, createdNews, "News/Article created successfully."));
});

// Get all news and articles
export const getAllNews = asyncHandler(async (req, res) => {
  const newsList = await News.find();
  res.status(200).json(new ApiResponseHandler(200, newsList, "News/Articles fetched successfully."));
});

// Get a specific news or article by ID
export const getNewsById = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    throw new ErrorHandler(404, "News/Article not found.");
  }

  res.status(200).json(new ApiResponseHandler(200, news, "News/Article fetched successfully."));
});

// Update a news or article by ID
export const updateNews = asyncHandler(async (req, res) => {
  const { title, content, author, publishedDate } = req.body;

  const news = await News.findById(req.params.id);
  if (!news) {
    throw new ErrorHandler(404, "News/Article not found.");
  }

  news.title = title || news.title;
  news.content = content || news.content;
  news.author = author || news.author;
  news.publishedDate = publishedDate || news.publishedDate;

  const updatedNews = await news.save();
  res.status(200).json(new ApiResponseHandler(200, updatedNews, "News/Article updated successfully."));
});


// Delete a news or article by ID
export const deleteNews = asyncHandler(async (req, res) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    throw new ErrorHandler(404, "News/Article not found.");
  }

  await news.deleteOne();
  res.status(200).json(new ApiResponseHandler(200, null, "News/Article deleted successfully."));
});
