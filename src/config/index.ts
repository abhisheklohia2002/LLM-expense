import dotenv from "dotenv";
import createHttpError from "http-errors";

dotenv.config();

const config = {
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  AWS_S3_ACL: process.env.AWS_S3_ACL,
  MONGO_URL: process.env.MONGO_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  QDRANT_URL:process.env.QDRANT_URL
};

for (const [key, value] of Object.entries(config)) {
  if (!value && key !== "AWS_S3_ACL") {
    throw new Error(`Missing required env variable: ${key}`);
  }
}

export default config as {
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_BUCKET: string;
  AWS_S3_ACL?: string;
  MONGO_URL: string;
  OPENAI_API_KEY: string;
  QDRANT_URL:string;
};