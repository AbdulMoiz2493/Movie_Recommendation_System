import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();


// TODO: Add the frontend url here...
app.use(cors({
    origin: "*"
}));
app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit : "16kb" }));
app.use(cookieParser());



//Import routes:
import authRouter from "./Routes/auth.routes.js";
import userRouter from "./Routes/user.routes.js";
import movieRouter from "./Routes/movie.routes.js";
import wishlistRouter from "./Routes/wishlist.routes.js"
import notificationRouter from "./Routes/notification.routes.js";
import communitiesRouter from "./Routes/communities.routes.js";
import adminRouter from "./Routes/admin.routes.js";
import newsRouter from "./Routes/news.routes.js";
import errorMiddleware from "./Middlewares/error.middleware.js"


//Customer and Resturant auth endpoint:
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/movies", movieRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/communities", communitiesRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/news", newsRouter);

//Error handler middleware:
app.use(errorMiddleware);


export default app;