import mongoose from "mongoose";

const chatUploadDoc = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed"],
      default: "uploaded",
    },
  },
  {
    timestamps: true,
  }
);

const chatUploadModel = mongoose.model("upload", chatUploadDoc);
export default chatUploadModel;