import { Annotation, MessagesAnnotation } from '@langchain/langgraph';



const State = Annotation.Root({
    ...MessagesAnnotation.spec,

})


export default State