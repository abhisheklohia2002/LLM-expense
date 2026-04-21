import * as z from "zod";
import { tool } from "langchain";
import expenseModel from "../model/expense.model";

const addExpense = tool(async ({ amount, title }) => {
    const create = await expenseModel.create({
        title,
        amount
    })
    if(!create){
    return JSON.stringify({ status: 'Failed to Add Info!',create })
    }
    await create.save()
    return JSON.stringify({ status: 'Success!',create })
}, {
    name: "add_expense",
    description: "Add the given expense to database",
    schema: z.object({
        title: z.string().describe("The expense title"),
        amount: z.number().describe("The amount spent"),
    }),
});

export default addExpense;
