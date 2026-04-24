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

class Chats {
  constructor(private storage: IFileStorage) {}

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
        console.log(fileName,'fileName')
        // const pdfUrl = this.storage.getObjecUri(fileName) as unknown as string;
        const pdfBuffer = await this.storage.getObject(fileName);
        console.log("Uploading to S3 with key:",pdfBuffer);
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
}

export default Chats;
