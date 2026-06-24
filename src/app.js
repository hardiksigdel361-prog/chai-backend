import express from "express"
import cors from "cors" 
import cookieParser from "cookie-parser"
import path from "path";
import dotenv from "dotenv";


dotenv.config();
const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "50MB"}))
app.use(express.urlencoded({extended: true, limit: "50MB"}))
app.use(express.static(path.join(process.cwd(), "public")));
app.use(cookieParser())


//routes import

import userRouter from './routes/user.routes.js'


// routes declaration
app.use("/api/v1/users", userRouter)


export default app

