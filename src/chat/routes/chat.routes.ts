import express, {
    type Request,
    type Response,
    type NextFunction,
} from "express";

import S3Storage from "../../common/S3Storage";
import createHttpError from "http-errors";
import fileUpload from "express-fileupload";
import Chats from "../controller/chat.controller";
const storage = new S3Storage();
const chatRouter = express.Router()

const uploadMiddleware = fileUpload({
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    abortOnLimit: true,
    limitHandler: (req: Request, res: Response, next: NextFunction) => {
        next(createHttpError(400, "File size exceeds the limit"));
    },
});
const chat = new Chats(storage)
chatRouter.post('/upload',uploadMiddleware,(req, res, next)=>chat.upload(req, res, next))
export default chatRouter;
