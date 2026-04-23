import express, {
    type Request,
    type Response,
    type NextFunction,
} from "express";
import S3Storage from "../../common/S3Storage";
const storage = new S3Storage();
const chatRouter = express.Router()




export default chatRouter;
