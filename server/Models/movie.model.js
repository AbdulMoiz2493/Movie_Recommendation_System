import mongoose, { Schema } from "mongoose";


const movieSchema = new Schema(
  {
    title: { type: String, required: true },
    genre: [String],
    director: { type: Schema.Types.ObjectId, ref: "Director" },
    cast: [{ type: Schema.Types.ObjectId, ref: "Actor" }],
    releaseDate: { type: Date },
    runtime: { type: Number }, // in minutes
    synopsis: { type: String },
    averageRating: { type: Number, default: 0 },
    coverPhoto: { type: String },
    trivia: [String],
    goofs: [String],
    soundtrackInfo: [String],
    ageRating: { type: String },
    parentalGuidance: { type: String },
    reviews: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        reviewText: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    boxOffice: {
      openingWeekend: { type: Number },
      totalEarnings: { type: Number },
      internationalRevenue: { type: Number },
    },
    awards: [
      {
        awardName: { type: String },
        year: { type: Number },
        result: { type: String }, // e.g., "Won" or "Nominated"
      },
    ],
  },
  { timestamps: true }
);

export const Movie = mongoose.model("Movie", movieSchema);
