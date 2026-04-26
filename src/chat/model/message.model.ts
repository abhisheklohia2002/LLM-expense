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
    type: {
      type: String,
      enum: ["text", "chart"],
      default: "text",
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
    kind: {
      type: String,
      enum: ["tool_call", "tool_result"],
    },
    chart: {
      title: String,
      description: String,
      data: mongoose.Schema.Types.Mixed,
    },
    toolName: {
      type: String,
    },

    args: {
      type: mongoose.Schema.Types.Mixed,
    },

    result: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

const MessageModel = mongoose.model("message", messageSchema);

export default MessageModel;
