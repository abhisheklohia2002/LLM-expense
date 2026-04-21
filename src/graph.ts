import { MemorySaver, StateGraph } from "@langchain/langgraph"
import State from "./state"
import addExpense from "./tools/add-expense.tool"
import LLM from "./agent"
import { ToolNode } from "@langchain/langgraph/prebuilt"
import type { AIMessage } from "langchain"
import db from "./db/Connection"

db()
let tools = [addExpense]
const callModel = async (state: typeof State.State) => {
    const llmWithNodes = LLM.bindTools(tools);
    const response = await llmWithNodes.invoke([
        {
            role: 'system',
            content: `You are a helpful expense tracking Assistant.current datetime ${new Date().toISOString()}
            .Call add expense tool to add the expense to database
            `
        },
        ...state.messages
    ])
    return {
        messages: [response]
    }
}

const toolNode = new ToolNode(tools)
const shouldContinue = async (state: typeof State.State) => {
    const message = state.messages;
    const lastMessage = message.at(-1) as AIMessage;
    if (lastMessage.tool_calls?.length) {
        return "tools"
    }
    else {
        return "__end__"
    }
}

async function graphMethod() {
    const graph = new StateGraph(State);
    graph.addNode('callModel', callModel)
        .addNode('tools', toolNode)
        .addEdge("__start__", 'callModel')
        .addConditionalEdges('callModel', shouldContinue, {
            tools: "tools",
            __end__: "__end__"
        })
      .addEdge("tools", "callModel");

    const agent = await graph.compile(
        {
            checkpointer: new MemorySaver()
        }
    );

    const response = await agent.invoke({
        messages: {
            role: "user",
            content: `hii,i just brought a laptop a 8000 `
        }
    },
        {
            configurable: { thread_id: 1 }
        }
    )

    console.log('AI: ', JSON.stringify(response, null, 3))
}

graphMethod()