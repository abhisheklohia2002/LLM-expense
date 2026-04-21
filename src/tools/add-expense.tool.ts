import * as z from "zod";
import { tool } from "langchain";

const addExpense = tool(({ amount, title }) => {
    console.log('add expense',title,amount)
    return JSON.stringify({ status: 'Success!' })
}, {
    name: "add_expense",
    description: "Add the given expense to database",
    schema: z.object({
        title: z.string().describe("The expense title"),
        amount: z.number().describe("The amount spent"),
    }),
});

export default addExpense;
