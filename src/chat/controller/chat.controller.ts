import type {
  NextFunction,
  Request,
  Response,
} from "express-serve-static-core";
import type { IFileStorage } from "../../types/store";
import { validationResult } from "express-validator";
import createHttpError from "http-errors";
import type { UploadedFile } from "express-fileupload";
import { v4 as uuidv4 } from "uuid";

import chatUploadModel from "../model/upload.model";
import { indexPDF } from "../../db/qdrantConnections";
import type ChatService from "../service/chat.service";
import graphMethod from "../../graph";
import type { StreamMessage } from "../../types/types";

class Chats {
  constructor(
    private storage: IFileStorage,
    private chatService: ChatService,
  ) {}

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const result = validationResult(req);

      if (!result.isEmpty()) {
        return next(createHttpError(400, "Validation failed"));
      }

      if (!req.files || !req.files.file) {
        return next(createHttpError(400, "PDF file is required"));
      }

      const pdfFile = req.files.file as UploadedFile;

      if (pdfFile.mimetype !== "application/pdf") {
        return next(createHttpError(400, "Only PDF files are allowed"));
      }

      const fileName = `${uuidv4()}.pdf`;

      await this.storage.upload({
        filename: fileName,
        fileData: pdfFile.data,
        mimeType: pdfFile.mimetype,
      });
      const uploadDoc = await chatUploadModel.create({
        userId: "1",
        originalFileName: pdfFile.name,
        fileName,
        mimeType: pdfFile.mimetype,
        size: pdfFile.size,
        status: "uploaded",
      });
      //   const uploadDoc = {
      //     _id:"69ea47c7ad3df5bd27d80b9b",
      //     userId: "1",
      //     originalFileName: "jenkins_ubuntu_docker_commands.pdf",
      //     fileName: "2e02239b-b855-419f-b6f6-6ae46b5f995e.pdf",
      //     mimeType: "application/pdf",
      //     size: 4823,
      //     status: "uploaded",
      //   };
      let response;
      if (uploadDoc) {
        console.log(fileName, "fileName");
        // const pdfUrl = this.storage.getObjecUri(fileName) as unknown as string;
        const pdfBuffer = await this.storage.getObject(fileName);
        console.log("Uploading to S3 with key:", pdfBuffer);
        await indexPDF({
          pdfBuffer,
          documentId: String(uploadDoc._id),
          userId: uploadDoc.userId,
          fileName: uploadDoc.originalFileName,
        });

        response = await chatUploadModel.findByIdAndUpdate(uploadDoc._id, {
          status: "ready",
        });
      }
      return res.status(201).json({
        message: "PDF uploaded successfully",
        response: response ? response : "Failed",
      });
    } catch (error) {
      return next(error);
    }
  }

  chat = async (req: Request, res: Response, next: NextFunction) => {
    const result = validationResult(req)
    if (!result.isEmpty()) {
      return next(createHttpError(400, "Validation failed"));
    }
    const data = req.body;
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    const stream = await graphMethod(data);

    let assistantMessage: any = null;
    let finalAssistantText = "";
    const lastUserMessage = data?.messages
      ?.filter((msg: any) => msg.role === "user")
      ?.at(-1);

    const messageReq = lastUserMessage?.content;
    await this.chatService.createMessage({
      chatId: data.chatId,
      role: "user",
      content: messageReq,
      status: "completed",
    });
    assistantMessage = await this.chatService.createMessage({
      chatId: data.chatId,
      role: "ai",
      content: "",
      status: "streaming",
    });
    try {
      for await (const [mode, chunk] of stream) {
        let message: StreamMessage | null = null;

        if (mode === "custom") {
          message = chunk as StreamMessage;
        } else if (mode === "messages") {
          const [messageChunk, metadata] = chunk as any;

          if (messageChunk?.type === "ai" && messageChunk?.content) {
            const text = messageChunk.content as string;
            finalAssistantText += text;
            message = {
              type: "ai",
              payload: {
                text: messageChunk.content as string,
              },
            };
          }
        }

        if (!message) continue;
        res.write(`event: ${mode}\n`);
        res.write(`data: ${JSON.stringify(message)}\n\n`);
      }

      await this.chatService.updateMessage(assistantMessage._id, {
        content: finalAssistantText,
        status: "completed",
      });

      res.write(`event: end\n`);
      res.write(
        `data: ${JSON.stringify({
          type: "end",
        })}\n\n`,
      );

      res.end();
    } catch (error: any) {
      if (assistantMessage?._id) {
        await this.chatService.updateMessage(assistantMessage._id, {
          content: finalAssistantText,
          status: "failed",
        });
      }
      res.write(`event: error\n`);
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          payload: error?.message || "Unknown error",
        })}\n\n`,
      );
      res.end();
    }
  };

  createChatWindow = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return next(createHttpError(400, "Validation failed"));
    }

    try {
      const createWindow = await this.chatService.createChat(req.body);
      if (!createWindow) {
        const error = createHttpError(500, "chat was not save");
        next(error);
        return;
      }
      res.status(201).json({ chat: createWindow });
    } catch (error) {
      return next(error);
    }
  };

  updateChatWindow = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return next(createHttpError(400, "Validation failed"));
    }

    try {
      const { chatId } = req.params;
      const updateWindow = await this.chatService.updateChat(
        req.body,
        chatId as string,
      );
      if (!updateWindow) {
        const error = createHttpError(500, "chat was not update");
        next(error);
        return;
      }
      res.status(201).json({ chat: updateWindow });
    } catch (error) {
      return next(error);
    }
  };
  deleteChatWindow = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { chatId } = req.params;
      const deleteWindow = await this.chatService.deleteChat(chatId as string);
      if (!deleteWindow) {
        const error = createHttpError(500, "chat was not delete");
        next(error);
        return;
      }
      res.status(201).json({ chat: deleteWindow });
    } catch (error) {
      return next(error);
    }
  };

  getChatWindow = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const getChatByUserId = await this.chatService.getChatByUserId(
        userId as string,
      );
      if (!getChatByUserId) {
        const error = createHttpError(500, "chat was not getting");
        next(error);
        return;
      }
      res.status(201).json({ chat: getChatByUserId });
    } catch (error) {
      return next(error);
    }
  };
}

export default Chats;
