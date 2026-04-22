import express, { type Request, type Response } from "express"
import cors from "cors";
import dotenv from "dotenv"
import graphMethod from "./src/graph";
dotenv.config()
const app = express()

app.use(express.json())
app.use(cors())

app.get('/health', (req: Request, res: Response) => {
    res.send("i am good")
})

app.post("/chat", async (req: Request, res: Response) => {
    const data = req.body;

    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        // "Cache-Control": "no-cache, no-transform",
        // Connection: "keep-alive",
    });
    try {
        const stream = await graphMethod(data);

        for await (const [eventType, chunk] of stream) {
            const text = JSON.stringify(chunk[0].content, null, 2);
            console.log('evenType', eventType)
            console.log(text)

            let message = {type:"ai",payload:chunk[0].content}
              res.write(`event: ${eventType}\n`);
              res.write(`data: ${JSON.stringify(message)}\n\n`);
        }

        // res.write(`event: end\n`);
        // res.write(`data: done\n\n`);
        res.end();
    } catch (error: any) {
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify(error?.message || "Unknown error")}\n\n`);
        res.end();
    }
});

app.listen(8080, () => {
    console.log(`server is ready`)
})