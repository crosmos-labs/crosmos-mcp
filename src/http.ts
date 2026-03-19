import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { createServer } from "./server.js";

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
app.use(express.json());

const transports: Map<string, SSEServerTransport> = new Map();

app.get("/sse", async (_req, res) => {
  const server = createServer();
  const transport = new SSEServerTransport("/message", res);
  transports.set(transport.sessionId, transport);

  res.on("close", () => {
    transports.delete(transport.sessionId);
  });

  await server.connect(transport);
});

app.post("/message", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);

  if (!transport) {
    res.status(400).json({ error: "No transport found for sessionId" });
    return;
  }

  await transport.handlePostMessage(req, res);
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "crosmos-mcp" });
});

app.listen(PORT, HOST, () => {
  console.log(`Crosmos MCP HTTP server running at http://${HOST}:${PORT}`);
  console.log(`SSE endpoint: http://${HOST}:${PORT}/sse`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});
