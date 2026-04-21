import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();

const LLM = new ChatOpenAI({
  model: "gpt-4.1-nano",
  temperature:0
});

export default LLM;
