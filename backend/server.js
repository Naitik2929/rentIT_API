import path from "path";
import express from "express";
const port = process.env.port || 6969;
import dotenv from "dotenv";
import db from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import { notFound, errorHandler } from "./middlerware/errorMiddleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import prodcutRoutes from "./routes/productRoutes.js";
import Twilio from "twilio";
db();
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/users", userRoutes);
app.use("/api/product", prodcutRoutes);

app.get("/", (req, res) => {
  res.send("API is running....");
});

app.use(notFound);
app.use(errorHandler);
app.listen(port, () => console.log(`Server is running on ${port}...`));
