import { getFloat64LE } from './../../node_modules/mongodb/src/bson';
import * as z from "zod";
import { tool } from "langchain";
import expenseModel from "../model/expense.model";

const getExpense = tool(async () => {
    const getExp = await expenseModel.find({});
    return JSON.stringify({status:'success',data:getExp})
}, {
    name: "get_expense",
    description: "Get all the given expense from the database",
});


export const getByNameExpense = tool(async ({title,amount}) => {
    const getExp = await expenseModel.find({title,amount});
    return JSON.stringify({status:'success',data:getExp})
}, {
    name: "get_expense",
    description: "Get all the given expense from the database",
    schema:z.object({
        title:z.string().describe("Title name"),
        amount:z.number().describe("amount Price")
    })
});

export default getExpense;
