import express from "express";
import cors from "cors";
import "dotenv/config";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoute.js";

const app = express();
const PORT = process.env.PORT || 5000;
connectDB();

dotenv.config();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true }));

// API Endpoints
app.get("/", (req, res) => {
  res.send("Hi from the server!");
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
