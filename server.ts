import express, { type Request, type Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import graphMethod from "./src/graph";
import type { StreamMessage } from "./src/types/types";
import chatRouter from "./src/chat/routes/chat.routes";
import auth from "./src/users/routes/user.router";
import path from "path";
const app = express();
const PORT = 5000;
app.use(express.json());
app.use(cors());
app.use(
  express.static(path.join(__dirname, "./public"), { dotfiles: "allow" }),
);
app.get("/.well-known/jwks.json", (req, res) => {
  res.sendFile("jwks.json", { root: "public/.well-known" });
});
app.use("/api/chat", chatRouter);
app.use("/api/auth", auth);

app.get("/health", (req: Request, res: Response) => {
  res.send("i am good");
});

app.post("/chat", async (req: Request, res: Response) => {
  const data = req.body;

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  try {
    const stream = await graphMethod(data);

    for await (const [mode, chunk] of stream) {
      let message: StreamMessage | null = null;

      if (mode === "custom") {
        message = chunk as StreamMessage;
      } else if (mode === "messages") {
        const [messageChunk, metadata] = chunk as any;

        if (messageChunk?.type === "ai" && messageChunk?.content) {
          message = {
            type: "ai",
            payload: {
              text: messageChunk.content as string,
            },
          };
        }
      }

      if (!message) continue;

      res.write(`event: ${mode}\n`);
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    }

    res.end();
  } catch (error: any) {
    res.write(`event: error\n`);
    res.write(
      `data: ${JSON.stringify({
        type: "error",
        payload: error?.message || "Unknown error",
      })}\n\n`,
    );
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`server is ready http://localhost:${PORT}`);
});
