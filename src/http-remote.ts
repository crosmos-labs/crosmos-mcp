#!/usr/bin/env node
/**
 * Remote MCP server entry point with OAuth 2.1 authentication.
 *
 * Used when deployed as a Claude custom connector (e.g., mcp.iiviie.dev).
 * Uses Streamable HTTP transport and proxies OAuth to the crosmos backend.
 *
 * The local stdio/SSE modes (stdio.ts, http.ts) remain unchanged for
 * npm package usage with static API keys.
 */

import { randomUUID } from "node:crypto";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";
import { ProxyOAuthServerProvider } from "@modelcontextprotocol/sdk/server/auth/providers/proxyProvider.js";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import { createServer } from "./server.js";
import { config } from "./config/index.js";

const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";
const MCP_BASE_URL = process.env.MCP_BASE_URL || `http://localhost:${PORT}`;

// ── OAuth proxy provider ──────────────────────────────────────────────

const oauthProvider = new ProxyOAuthServerProvider({
  endpoints: {
    authorizationUrl: config.oauth.authorizationUrl,
    tokenUrl: config.oauth.tokenUrl,
    revocationUrl: undefined,
    registrationUrl: config.oauth.registrationUrl,
  },

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    // Verify the token by calling the backend's /auth/me endpoint
    const url = `${config.api.baseUrl}/api/v1/auth/me`;
    console.log(`[verifyAccessToken] Calling ${url} with token: ${token.substring(0, 20)}...`);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[verifyAccessToken] Failed: ${response.status} ${body}`);
      throw new Error(`Token verification failed: ${response.status}`);
    }

    const user = (await response.json()) as { user_id: number; email: string };
    console.log(`[verifyAccessToken] Success: user_id=${user.user_id}`);

    // Decode the JWT payload to get expiration time (required by bearerAuth middleware)
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());

    return {
      token,
      clientId: "crosmos-mcp",
      scopes: [],
      expiresAt: payload.exp,
      extra: { userId: user.user_id, email: user.email },
    };
  },

  async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
    // Fetch real client data from the backend (needed for redirect_uri validation)
    try {
      const response = await fetch(`${config.api.baseUrl}/oauth/client/${clientId}`);
      if (!response.ok) {
        return undefined;
      }

      const data = (await response.json()) as {
        client_id: string;
        redirect_uris: string[];
        client_name: string | null;
        grant_types: string[];
        response_types: string[];
        token_endpoint_auth_method: string;
      };

      return {
        client_id: data.client_id,
        redirect_uris: data.redirect_uris,
        grant_types: data.grant_types,
        response_types: data.response_types,
        client_name: data.client_name ?? undefined,
        token_endpoint_auth_method: data.token_endpoint_auth_method,
      };
    } catch {
      return undefined;
    }
  },
});

// ── Express app ───────────────────────────────────────────────────────

const app = express();

// Trust the reverse proxy (nginx) so rate limiting uses real client IPs
app.set("trust proxy", 1);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.url} → ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// CORS
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Mcp-Session-Id");
  if (_req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Mount OAuth routes (handles /.well-known/oauth-authorization-server, /authorize, /token, /register)
app.use(
  mcpAuthRouter({
    provider: oauthProvider,
    issuerUrl: new URL(MCP_BASE_URL),
    baseUrl: new URL(MCP_BASE_URL),
    scopesSupported: [],
  })
);

// Bearer auth middleware for MCP endpoints
const bearerAuth = requireBearerAuth({
  verifier: oauthProvider,
});

// ── Streamable HTTP transport ─────────────────────────────────────────

// Map of session ID to transport
const transports = new Map<string, StreamableHTTPServerTransport>();

// Handle MCP requests (POST /mcp)
app.post("/", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports.has(sessionId)) {
    transport = transports.get(sessionId)!;
  } else if (!sessionId) {
    // New session — create transport and connect server
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    const server = createServer();
    await server.connect(transport);

    if (transport.sessionId) {
      transports.set(transport.sessionId, transport);
    }

    transport.onclose = () => {
      if (transport.sessionId) {
        transports.delete(transport.sessionId);
      }
    };
  } else {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// Handle SSE streams (GET /mcp)
app.get("/", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "Missing or invalid session ID" });
    return;
  }

  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// Handle session termination (DELETE /mcp)
app.delete("/", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports.has(sessionId)) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const transport = transports.get(sessionId)!;
  await transport.close();
  transports.delete(sessionId);
  res.sendStatus(204);
});

// Health check (no auth required)
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "crosmos-mcp-remote", mode: "oauth" });
});

// Global error handler (must be after all routes)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Start ─────────────────────────────────────────────────────────────

app.listen(PORT, HOST, () => {
  console.log(`Crosmos MCP Remote server running at http://${HOST}:${PORT}`);
  console.log(`MCP endpoint: http://${HOST}:${PORT}/`);
  console.log(`OAuth metadata: http://${HOST}:${PORT}/.well-known/oauth-authorization-server`);
  console.log(`Backend: ${config.api.baseUrl}`);
  console.log(`Mode: OAuth (remote connector)`);
});
