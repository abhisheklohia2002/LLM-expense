
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getRetriever } from "../db/qdrantConnections";


const searchFinanceKnowledge = tool(
  async ({ query }) => {
    const retriever = await getRetriever();
    const docs = await retriever.invoke(query);

    if (!docs.length) {
      return "No relevant finance-related context found.";
    }

    return docs
      .map((doc, index) => {
        return `Source ${index + 1}:\n${doc.pageContent}`;
      })
      .join("\n\n");
  },
  {
    name: "search_finance_knowledge",
    description:
      "Search uploaded finance-related documents like expense policies, invoices, reimbursements, tax notes, and accounting PDFs.",
    schema: z.object({
      query: z.string(),
    }),
  }
);

export default searchFinanceKnowledge;