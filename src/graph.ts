import {
  MemorySaver,
  StateGraph,
  type LangGraphRunnableConfig,
} from "@langchain/langgraph";
import State from "./state";
import addExpense from "./tools/add-expense.tool";
import getModel from "./agent";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage } from "langchain";
import db from "./db/Connection";
import getExpense from "./tools/get-exprense.tool";
import Readline from "node:readline/promises";
import deleteExpense from "./tools/delete-expense.tool";
import generateChartExpense from "./tools/generateChart.tool";
import type { StreamMessage } from "../types";

db();
let tools = [addExpense, getExpense, deleteExpense, generateChartExpense];
const callModel = async (state: typeof State.State) => {
  const llmWithNodes = getModel(state.mode ?? "standard").bindTools(tools);
  const response = await llmWithNodes.invoke([
    {
      role: "system",
      content: `
      You are a helpful expense tracking assistant.
Current datetime: ${new Date().toISOString()}

Use tools only when the user is explicitly asking to:
- add an expense
- update an expense
- delete an expense
- view analytics or charts
- fetch finance data

If the user is just greeting, chatting, or asking a general question, reply normally without calling any tool.
Never call a tool unless the user's request clearly requires it.
            `,
    },
    ...state.messages,
  ]);
  return {
    messages: [response],
  };
};

const toolNode = new ToolNode(tools);
const shouldContinue = async (
  state: typeof State.State,
  config: LangGraphRunnableConfig,
) => {
  const message = state.messages;
  const lastMessage = message.at(-1) as AIMessage;
  if (lastMessage.tool_calls?.length) {
    //send custom events
    const customMessage: StreamMessage = {
      type: "toolCall:start",
      payload: {
        name: lastMessage?.tool_calls[0]?.name as string,
        args: lastMessage?.tool_calls[0]?.args as any,
      },
    };

    config.writer?.(customMessage);
    return "tools";
  } else {
    return "__end__";
  }
};

const shouldToolNode = async (state: typeof State.State) => {
  const message = state.messages;
  const lastMessage = message.at(-1) as AIMessage;
  const hasGenerateChartTool = lastMessage.tool_calls?.some(
    (toolCall) => toolCall.name === "generateChart_expense",
  );
  if (hasGenerateChartTool) {
    return "__end__";
  }
  return "callModel";
};

async function graphMethod(data: any) {
  const graph = new StateGraph(State);
  graph
    .addNode("callModel", callModel)
    .addNode("tools", toolNode)
    .addEdge("__start__", "callModel")
    .addConditionalEdges("callModel", shouldContinue, {
      tools: "tools",
      __end__: "__end__",
    })
    .addConditionalEdges("tools", shouldToolNode, {
      callModel: "callModel",
      __end__: "__end__",
    });

  const agent = await graph.compile({
    checkpointer: new MemorySaver(),
  });

  return await agent.stream(data as any, {
    configurable: { thread_id: "1" },
    streamMode: ["messages", "custom"],
  });
}

export default graphMethod;
