import ChatModel from "../model/chat.model";
import MessageModel from "../model/message.model";

type CreateMessageDto = {
  chatId: string;
  role: "user" | "ai";
  content: string;
  status?: "completed" | "streaming" | "failed";
  kind?: "tool_call" | "tool_result";
  type?: "text" | "chart";
  toolName?: string;
  args?: Record<string, any>;
  result?: Record<string, any>;
  chart?: {
    title: string;
    description?: string;
    data: any[];
  };
};

type CreateChatDto = {
  userId: string;
  title: string;
  isPinned?: boolean;
  isDeleted?: boolean;
};
class ChatService {
  createMessage = async (data: CreateMessageDto) => {
    return await MessageModel.create(data);
  };

  updateMessage = async (
    messageId: string,
    data: Partial<CreateMessageDto>,
  ) => {
    return await MessageModel.findByIdAndUpdate(messageId, data, {
      returnDocument: "after",
    });
  };

  createChat = async (payload: CreateChatDto) => {
    return await ChatModel.create(payload);
  };

  updateChat = async (payload: CreateChatDto, chatId: string) => {
    const updatedChat = await ChatModel.findByIdAndUpdate(chatId, payload, {
      returnDocument: "after",
      runValidators: true,
    });

    return updatedChat;
  };
  deleteChat = async (chatId: string) => {
    const isdeleteChat = await ChatModel.findByIdAndDelete({ _id: chatId });
    await MessageModel.deleteMany({ chatId });
    return isdeleteChat;
  };
  getChatByUserId = async (userId: string) => {
    const getChat = await ChatModel.find({ userId });
    return getChat;
  };

  getMessageByChatId = async (chatId: string) => {
    const getMessage = await MessageModel.find({ chatId });
    return getMessage;
  };
}

export default ChatService;
