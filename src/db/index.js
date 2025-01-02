import mongoose from "mongoose"
import { DB_NAME } from "../constants.js";

const connectDB=async ()=>{
    try {
        const connectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDb connected!! Host: `, connectionInstance.connection.host);
        
    } catch (error) {
        console.log("Mongoose running got Failed: ", error);
        process.exit(1);
        
    }
}

export default connectDB;