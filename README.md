# Crosmos Memory MCP Server

MCP server for the Crosmos Memory Engine, providing tools for memory search, ingestion, and health monitoring.

## Features

- **search_memories**: Search memories using hybrid retrieval (semantic, keyword, and graph-based)
- **add_memory**: Add new memories with automatic entity and relationship extraction
- **health_check**: Monitor the health status of the Crosmos Memory Engine

## Installation

### Quick install (recommended)

Requires Node.js >= 18 and npm.

```bash
npm install -g https://mcp.crosmos.dev/crosmos-mcp.tgz
```

Or use the install script (macOS / Linux):

```bash
curl -fsSL https://mcp.crosmos.dev/install.sh | bash
```

After installation, add the MCP server to your client of choice — see [Usage](#usage) below for config examples.

### From source

```bash
git clone https://github.com/crosmos-org/crosmos-mcp
cd crosmos-mcp
bun install
bun run build
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

After installing, add the MCP server to your preferred client. Replace `csk_your_api_key_here` with your actual API key in all examples below.

### Claude Code

Run this from your terminal:

```bash
claude mcp add crosmos-memory -- crosmos-mcp
```

Then set the environment variables in your Claude Code settings or `.env`:

```
CROSMOS_API_BASE_URL=https://api.crosmos.dev
CROSMOS_API_KEY=csk_your_api_key_here
```

### Claude Desktop

Add to your config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "crosmos-memory": {
      "command": "crosmos-mcp",
      "env": {
        "CROSMOS_API_BASE_URL": "https://api.crosmos.dev",
        "CROSMOS_API_KEY": "csk_your_api_key_here"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

### opencode

Add to `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "crosmos-memory": {
      "type": "local",
      "command": ["crosmos-mcp"],
      "environment": {
        "CROSMOS_API_BASE_URL": "https://api.crosmos.dev",
        "CROSMOS_API_KEY": "csk_your_api_key_here"
      }
    }
  }
}
```

### Other MCP clients

The `crosmos-mcp` binary uses stdio transport and works with any MCP-compatible client. Point your client to the binary and set these environment variables:

| Variable | Value |
|----------|-------|
| `CROSMOS_API_BASE_URL` | `https://api.crosmos.dev` |
| `CROSMOS_API_KEY` | Your API key (`csk_...`) |
| `DEFAULT_SPACE_ID` | Memory space ID (optional, defaults to `1`) |

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

### Self-hosted HTTP Server

You can run the MCP HTTP server locally or on your own infrastructure:

```bash
docker build -t crosmos-mcp .
docker run -p 3000:3000 \
  -e CROSMOS_API_BASE_URL=https://api.crosmos.dev \
  -e CROSMOS_API_KEY=csk_your_api_key_here \
  crosmos-mcp
```

The Docker build produces both the HTTP server and the `crosmos-mcp.tgz` tarball. The container serves:
- The MCP server (SSE transport) on port 3000
- `/install.sh` and `/crosmos-mcp.tgz` for the installer script

## License

MIT
