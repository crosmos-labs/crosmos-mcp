# Crosmos Memory MCP Server

MCP server for the Crosmos Memory Engine, providing tools for memory search, ingestion, and health monitoring.

## Features

- **search_memories**: Search memories using hybrid retrieval (semantic, keyword, and graph-based)
- **add_memory**: Add new memories with automatic entity and relationship extraction
- **health_check**: Monitor the health status of the Crosmos Memory Engine

## Installation

### As npm package (recommended)

```bash
npm install crosmos-mcp
# or
bun add crosmos-mcp
```

### From source

```bash
git clone https://github.com/crosmos-org/crosmos-mcp
cd crosmos-mcp
bun install
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CROSMOS_API_BASE_URL` | Base URL for the Crosmos Memory API | `http://localhost:8000` |
| `CROSMOS_API_KEY` | API key for authentication (required) | - |
| `CROSMOS_API_TIMEOUT` | Request timeout in milliseconds | `30000` |
| `DEFAULT_SPACE_ID` | Default memory space ID | `1` |
| `PORT` | HTTP server port (HTTP mode only) | `3000` |
| `HOST` | HTTP server host (HTTP mode only) | `0.0.0.0` |

### Authentication

The MCP server requires an API key to authenticate with the Crosmos Memory Engine. Each user's API key provides access to their own memory space.

**To get your API key:**
1. Log in to your Crosmos dashboard
2. Navigate to Settings → API Keys
3. Create a new API key (format: `csk_...`)
4. Copy the key and set it as `CROSMOS_API_KEY`

## Usage

### 1. Local MCP (Claude Desktop, opencode, etc.)

Uses stdio transport. Perfect for local development.

**With npx:**
```bash
npx crosmos-mcp
```

**With bun:**
```bash
bunx crosmos-mcp
```

**In Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "crosmos": {
      "command": "npx",
      "args": ["crosmos-mcp"],
      "env": {
        "CROSMOS_API_BASE_URL": "https://memory.iiviie.dev",
        "CROSMOS_API_KEY": "csk_your_api_key_here"
      }
    }
  }
}
```

**In opencode config** (`~/.config/opencode/opencode.json`):
```json
{
  "mcp": {
    "crosmos": {
      "type": "local",
      "command": ["bun", "run", "/path/to/crosmos-mcp/src/stdio.ts"],
      "environment": {
        "CROSMOS_API_BASE_URL": "https://memory.iiviie.dev",
        "CROSMOS_API_KEY": "csk_your_api_key_here"
      }
    }
  }
}
```

### 2. Remote MCP (Claude.ai)

Uses HTTP/SSE transport. Host on any server.

**Start HTTP server:**
```bash
# Development
bun run dev:http

# Production
PORT=3000 HOST=0.0.0.0 CROSMOS_API_BASE_URL=https://memory.iiviie.dev CROSMOS_API_KEY=csk_your_key bun run start:http
```

**Endpoints:**
- SSE: `http://your-server:3000/sse`
- Messages: `http://your-server:3000/message`
- Health: `http://your-server:3000/health`

**Add to Claude.ai:**
1. Go to Settings → Connectors
2. Click "Add custom connector"
3. Enter URL: `https://mcp.iiviie.dev/sse`

## Development

```bash
# Run stdio mode with auto-reload
bun run dev

# Run HTTP mode with auto-reload
bun run dev:http

# Build for production
bun run build

# Lint & format
bun run lint:fix
bun run format

# Type check
bun run typecheck
```

## Project Structure

```
crosmos-mcp/
├── src/
│   ├── index.ts          # Exports for programmatic use
│   ├── server.ts         # MCP server setup (shared)
│   ├── stdio.ts          # Stdio transport entry
│   ├── http.ts           # HTTP transport entry
│   ├── config/
│   │   └── endpoints.ts  # API endpoint configuration
│   ├── client/
│   │   └── memory.ts     # HTTP client for Memory API
│   ├── tools/
│   │   ├── schemas.ts    # Zod schemas for tool inputs
│   │   ├── search.ts     # Search memories tool
│   │   ├── memory.ts     # Add memory tool
│   │   ├── health.ts     # Health check tool
│   │   └── index.ts
│   └── schemas/
│       ├── search.ts     # API response schemas
│       └── memory.ts     # API request/response schemas
├── package.json
├── tsconfig.json
├── biome.json
└── .env.example
```

## API Endpoints

The server communicates with these Crosmos Memory Engine endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/search` | POST | Search memories |
| `/api/v1/memory/add` | POST | Add new memories |
| `/health` | GET | Health check |

## Deployment

### Production Checklist

1. **Deploy Memory Engine** to `memory.iiviie.dev`
2. **Deploy MCP HTTP Server** to `mcp.iiviie.dev`:
    ```bash
    docker build -t crosmos-mcp .
    docker run -p 3000:3000 \
      -e CROSMOS_API_BASE_URL=https://memory.iiviie.dev \
      -e CROSMOS_API_KEY=csk_your_key \
      crosmos-mcp
    ```
3. **Publish npm package**:
   ```bash
   npm publish
   ```

### Docker

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production
COPY dist ./dist
ENV CROSMOS_API_BASE_URL=https://memory.iiviie.dev
ENV CROSMOS_API_KEY=csk_your_key
EXPOSE 3000
CMD ["bun", "run", "dist/http.js"]
```

## License

MIT
