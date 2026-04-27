import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

import S3Storage from "../../common/S3Storage";
import createHttpError from "http-errors";
import fileUpload from "express-fileupload";
import Chats from "../controller/chat.controller";
import { messageValidator } from "../../validators/message.validator";
import ChatService from "../service/chat.service";
const storage = new S3Storage();
const chatRouter = express.Router();
const chatService = new ChatService();
const uploadMiddleware = fileUpload({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  abortOnLimit: true,
  limitHandler: (req: Request, res: Response, next: NextFunction) => {
    next(createHttpError(400, "File size exceeds the limit"));
  },
});

const chat = new Chats(storage, chatService);
chatRouter.post(
  "/upload",
  uploadMiddleware,
  (req: Request, res: Response, next: NextFunction) =>
    chat.upload(req, res, next),
);
chatRouter.post("/", (req: Request, res: Response, next: NextFunction) =>
  chat.chat(req, res, next),
);

chatRouter.post('/create',(req: Request, res: Response, next: NextFunction) =>
  chat.createChatWindow(req, res, next),
)

chatRouter.put('/update/:chatId',(req: Request, res: Response, next: NextFunction) =>
  chat.updateChatWindow(req, res, next),
)

chatRouter.delete('/delete/:chatId',(req: Request, res: Response, next: NextFunction) =>
  chat.deleteChatWindow(req, res, next),
)

chatRouter.get('/get/:userId',(req: Request, res: Response, next: NextFunction) =>
  chat.getChatWindow(req, res, next),
)

chatRouter.get('/messages/:chatId',(req: Request, res: Response, next: NextFunction) =>
  chat.getMessageByChatId(req, res, next),
)


export default chatRouter;
