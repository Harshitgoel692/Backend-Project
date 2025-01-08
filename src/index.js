import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";


dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("Error occured before listening:", error);
        throw error;
    })

    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server running at port: ${process.env.PORT}`);
        
    })
})
.catch((error)=>{
    console.log("Connection to DB is Failed!!", error);
    
})