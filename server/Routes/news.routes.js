import express from 'express';
import {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
} from '../Controller/news.controller.js';
import { verifyUserJWT } from '../Middlewares/auth.middleware.js';

const router = express.Router();

// Route for creating a new news/article
router.post('/', verifyUserJWT, createNews);

// Route for getting all news/articles
router.get('/', getAllNews);

// Route for getting a specific news/article by ID
router.get('/:id', getNewsById);

// Route for updating a specific news/article by ID
router.put('/:id', verifyUserJWT, updateNews);

// Route for deleting a specific news/article by ID
router.delete('/:id', verifyUserJWT,  deleteNews);

export default router;
