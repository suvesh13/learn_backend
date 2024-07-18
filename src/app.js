import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"})) //json file(size) limit 16kb [apply limit thereofe it not crash] 
app.use(express.urlencoded({extended:true,limit:"16kb"})) // url incoded 
app.use(express.static("public")) // [pubilc is file name in vscode (folder)] img,file save in server

app.use(cookieParser())

export { app }