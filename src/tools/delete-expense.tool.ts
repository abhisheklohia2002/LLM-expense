import * as z from "zod";
import { tool } from "langchain";
import expenseModel from "../model/expense.model";

const deleteExpense = tool(async ({ amount, title }) => {
  const deleteByName = await expenseModel.deleteOne({title});
  if(!deleteByName){
    return JSON.stringify({status:'false'})
  }
    return JSON.stringify({status:'true',data:deleteByName}) 
}, {
    name: "delete_expense",
    description: "Delete the given expense to database",
    schema: z.object({
        title: z.string().describe("The expense title"),
        amount: z.number().describe("The amount spent"),
    }),
});

export default deleteExpense;
