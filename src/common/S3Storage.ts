import {
  DeleteObjectCommand,
  GetObjectCommand,
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
      !config.AWS_REGION ||
      !config.AWS_ACCESS_KEY_ID ||
      !config.AWS_SECRET_ACCESS_KEY ||
      !config.AWS_S3_BUCKET
    ) {
      throw createHttpError(500, "Missing S3 configuration");
    }

    this.bucket = config.AWS_S3_BUCKET;

    this.client = new S3Client({
      region: config.AWS_REGION,
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY_ID,
        secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async upload(data: IFileData): Promise<void> {
    const objectParams = {
      Bucket: config.AWS_S3_BUCKET,
      Key: data.filename,
      Body: data.fileData,
    };

    await this.client.send(new PutObjectCommand(objectParams));
  }

  async delete(filename: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: filename,
        }),
      );
    } catch (error) {
      throw createHttpError(500, "Failed to delete file from S3");
    }
  }

  getObjecUri(filename?: string): any {
    const bucket = config.AWS_S3_BUCKET;
    const region = config.AWS_REGION;

    if (typeof bucket === "string" && typeof region === "string") {
      return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
    }

    throw createHttpError(500, "Invalid S3 configurations");
  }

  async getObject(filename: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: filename,
      }),
    );

    if (!response.Body) {
      throw new Error("File not found");
    }

    const chunks: Buffer[] = [];

    for await (const chunk of response.Body as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }
}
