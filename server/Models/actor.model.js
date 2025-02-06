import mongoose, { Schema } from "mongoose";

const actorSchema = new Schema(
  {
    name: { type: String, required: true },
    biography: { type: String },
    filmography: [{ type: Schema.Types.ObjectId, ref: "Movie" }],
    awards: [
      {
        awardName: { type: String },
        year: { type: Number },
        result: { type: String },
      },
    ],
    photos: [String],
  },
  { timestamps: true }
);

export const Actor = mongoose.model("Actor", actorSchema);
