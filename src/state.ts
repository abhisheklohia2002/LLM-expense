import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

const State = Annotation.Root({
  ...MessagesAnnotation.spec,
  mode: Annotation<string>,
});

export default State;
