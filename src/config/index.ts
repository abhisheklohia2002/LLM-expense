import dotenv from "dotenv";
dotenv.config();

const config = {
  awsRegion: process.env.AWS_REGION || "",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  awsS3Bucket: process.env.AWS_S3_BUCKET || "",
  mongoUrl: process.env.MONGO_URL || "",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
};

export default config;