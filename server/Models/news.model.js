import mongoose, { Schema } from 'mongoose';

const newsSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },

    publishedDate: {
      type: Date,
      default: Date.now,
    },

  },
  { timestamps: true }
);

export const News = mongoose.model('News', newsSchema);
