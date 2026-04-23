import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import createHttpError from "http-errors";
import config from "../config";
import type { IFileData, IFileStorage } from "../types/store";

export default class S3Storage implements IFileStorage {
  private client: S3Client;
  private bucket: string;

  constructor() {
    if (
      !config.awsRegion ||
      !config.awsAccessKeyId ||
      !config.awsSecretAccessKey ||
      !config.awsS3Bucket
    ) {
      throw createHttpError(500, "Missing S3 configuration");
    }

    this.bucket = config.awsS3Bucket;

    this.client = new S3Client({
      region: config.awsRegion,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    });
  }

   async upload(data: IFileData): Promise<void> {
        const objectParams = {
            Bucket: !config.awsS3Bucket,
            Key: data.filename,
            Body: data.fileData,
        };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        await this.client.send(new PutObjectCommand(objectParams));
        return;
    }

  async delete(filename: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: filename,
        })
      );
    } catch (error) {
      throw createHttpError(500, "Failed to delete file from S3");
    }
  }

  getObjecUri(filename?: string): any {
        const bucket = config.awsS3Bucket;
        const region = config.awsRegion;
        if (typeof bucket === "string" && typeof region === "string") {
            return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
        }
        const error = createHttpError(500, "Invalid S3 configurations");
        throw error;
    }
}