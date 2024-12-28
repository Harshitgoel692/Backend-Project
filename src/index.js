import dotenv from "dotenv"
import connectDB from "./db/index.js";

console.log(`${process.env.PORT}`);


dotenv.config({
    path: './env'
})

connectDB();