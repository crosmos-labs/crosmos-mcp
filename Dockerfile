FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# Build bundled output for Docker runtime
RUN bun run build:docker
# Build tsc output + tarball for the install script
RUN bunx tsc && bun pm pack --destination /app

FROM oven/bun:1-slim
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/crosmos-mcp-*.tgz ./crosmos-mcp.tgz
COPY install.sh ./install.sh

ENV HOST=0.0.0.0

EXPOSE 3001

# Use http-remote.js for deployed instances (OAuth + Streamable HTTP)
# Use http.js for local/API-key mode
CMD ["bun", "run", "dist/http-remote.js"]
