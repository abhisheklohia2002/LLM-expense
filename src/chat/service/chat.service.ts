import MessageModel from "../model/message.model";

type CreateMessageDto = {
  chatId: string;
  role: "user" | "ai";
  content: string;
  status?: "completed" | "streaming" | "failed";
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
}

export default ChatService;
