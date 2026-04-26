import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chat",
      required: true,
      index: true,
    },

    role: {
      type: String,
      required: true,
      enum: ["user", "ai"],
    },

    content: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["completed", "streaming", "failed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

const MessageModel = mongoose.model("message", messageSchema);

export default MessageModel;