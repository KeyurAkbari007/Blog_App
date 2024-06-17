import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
//connect to database

connectDB();
// Get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(
//   cors({
//     origin: "http://localhost:3000",
//   })
// );

app.use(cookieParser());
app.use(fileUpload());

app.use("/uploads", express.static("uploads"));
app.use(express.static(path.resolve(__dirname, "client", "build")));

app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
