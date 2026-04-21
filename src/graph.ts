import { StateGraph } from "@langchain/langgraph"
import State from "./state"

const callModel = async (state: typeof State.State) => {

    return state
}


const toolNode = async (state: typeof State.State) => {
    return state

}









async function graphMethod() {
    const graph = new StateGraph(State);

}

graphMethod()