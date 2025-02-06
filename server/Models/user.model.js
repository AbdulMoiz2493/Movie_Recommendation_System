import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is Required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is Required"],
    },

    role: { type: String, enum: ['normal', 'admin'], default: 'normal' },

    avatar: {
      type: String,
      default:
        "https://i.pinimg.com/originals/be/61/a4/be61a49e03cb65e9c26d86b15e63e12a.jpg",
    },

    preferences: {
      type: {
        favoriteGenres: [String],
        favoriteActors: [{ type: Schema.Types.ObjectId, ref: 'Actor' }],
      },
      // required: function() { return this.role === 'normal'; },
    },

    wishlist: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
      // required: function() { return this.role === 'normal'; },
    },

    customLists: {
      type: [
        {
          title: String,
          description: String,
          movies: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
        },
      ],

    },

    notificationsEnabled: {
      type: Boolean,
      default: true,  
    },

    notifications: [
      {
        message: String,
        date: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
      },
    ],

    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);


//Hashing the password before saving..
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


//Checking password with the hash stored in the db.
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

//Generate access token..
userSchema.methods.generateAccessToken = function () {
    const access_token = jwt.sign({
        _id: this._id,
        email: this.email,
        avatar: this.avatar,
        phoneNo: this.phoneNo,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });

    return access_token;
}

//Generate Refresh Token..
userSchema.methods.generateRefreshToken = function () {
    const refresh_token = jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });

    return refresh_token;
}


export const User = mongoose.model("User", userSchema);
