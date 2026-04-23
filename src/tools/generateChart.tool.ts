import * as z from "zod";
import { tool } from "@langchain/core/tools";
import expenseModel from "../model/expense.model";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";

const generateChartExpense = tool(
  async ({ from, to, groupBy }, config: LangGraphRunnableConfig) => {
    try {
      const fromDate = new Date(from);
      const toDate = new Date(to);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return JSON.stringify({
          status: "failed",
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }

      toDate.setHours(23, 59, 59, 999);

      let groupId: any = {};
      let labelProjection: any = {};

      if (groupBy === "day") {
        groupId = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };

        labelProjection = {
          label: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
              },
            },
          },
        };
      }

      if (groupBy === "week") {
        groupId = {
          year: { $isoWeekYear: "$createdAt" },
          week: { $isoWeek: "$createdAt" },
        };

        labelProjection = {
          label: {
            $concat: [
              { $toString: "$_id.year" },
              "-W",
              { $toString: "$_id.week" },
            ],
          },
        };
      }

      if (groupBy === "month") {
        groupId = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };

        labelProjection = {
          label: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: [
                  { $lt: ["$_id.month", 10] },
                  { $concat: ["0", { $toString: "$_id.month" }] },
                  { $toString: "$_id.month" },
                ],
              },
            ],
          },
        };
      }

      if (groupBy === "year") {
        groupId = {
          year: { $year: "$createdAt" },
        };

        labelProjection = {
          label: { $toString: "$_id.year" },
        };
      }

      const chartData = await expenseModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: fromDate,
              $lte: toDate,
            },
          },
        },
        {
          $group: {
            _id: groupId,
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            ...labelProjection,
            totalAmount: 1,
            count: 1,
          },
        },
        {
          $sort: {
            label: 1,
          },
        },
      ]);
      const result = {
        status: "success",
        chartData,
      };
      config?.writer?.({
        type: "toolCall:end",
        payload: {
          name: "generateChart_expense",
          result,
        },
      });
      return JSON.stringify({
        status: "success",
        from,
        to,
        groupBy,
        chartData,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "failed",
        message: error.message || "Something went wrong",
      });
    }
  },
  {
    name: "generateChart_expense",
    description:
      "Generate expense chart data grouped by day, week, month, or year using createdAt",
    schema: z.object({
      from: z.string().describe("Start date in YYYY-MM-DD format"),
      to: z.string().describe("End date in YYYY-MM-DD format"),
      groupBy: z
        .enum(["day", "week", "month", "year"])
        .describe("Group expenses by day, week, month, or year"),
    }),
  },
);

export default generateChartExpense;
