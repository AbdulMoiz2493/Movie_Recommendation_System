import mongoose, { Schema } from "mongoose";

const communitySchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    posts: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
        replies: [
          {
            user: { type: Schema.Types.ObjectId, ref: 'User' },
            text: { type: String },
            createdAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],
  }, { timestamps: true });
  
export const Community = mongoose.model('Community', communitySchema);
  