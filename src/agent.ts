import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();
function getModel(mode:string) {
  const LLM = new ChatOpenAI({
    model: "gpt-4.1-nano",
    temperature: 0,
    reasoning: {
      effort: mode === "thinking" ? "medium" : "none",
    },
  });
  return LLM;
}
export default getModel;
