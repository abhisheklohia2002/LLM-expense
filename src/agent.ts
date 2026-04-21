import { ChatOpenAI } from "@langchain/openai";
import dotenv from "dotenv";
dotenv.config();

const model = new ChatOpenAI({
  model: "gpt-5.1-mini",
  temperature:0
});

export default model;
