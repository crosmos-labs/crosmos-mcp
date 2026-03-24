FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build:docker

FROM oven/bun:1-slim
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=builder /app/dist ./dist

ENV CROSMOS_API_BASE_URL=http://localhost:8000
ENV MCP_BASE_URL=https://mcp.iiviie.dev
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Use http-remote.js for deployed instances (OAuth + Streamable HTTP)
# Use http.js for local/API-key mode
CMD ["bun", "run", "dist/http-remote.js"]
