# Crosmos Memory MCP Server

MCP server for the Crosmos Memory Engine, providing tools for memory search, ingestion, and health monitoring.

## Features

- **search_memories**: Search memories using hybrid retrieval (semantic, keyword, and graph-based)
- **add_memory**: Add new memories with automatic entity and relationship extraction
- **health_check**: Monitor the health status of the Crosmos Memory Engine

## Installation

```bash
bun install
```

## Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CROSMOS_API_BASE_URL` | Base URL for the Crosmos Memory API | `http://localhost:8000` |
| `CROSMOS_API_TIMEOUT` | Request timeout in milliseconds | `30000` |
| `DEFAULT_SPACE_ID` | Default memory space ID | `1` |

## Development

```bash
# Run in development mode with auto-reload
bun run dev

# Build for production
bun run build

# Run linter
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format

# Type check
bun run typecheck
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "crosmos-memory": {
      "command": "bun",
      "args": ["run", "/path/to/crosmos-mcp/src/index.ts"],
      "env": {
        "CROSMOS_API_BASE_URL": "http://localhost:8000"
      }
    }
  }
}
```

## Project Structure

```
crosmos-mcp/
├── src/
│   ├── index.ts          # Entry point and MCP server setup
│   ├── config/
│   │   ├── endpoints.ts  # API endpoint configuration
│   │   └── index.ts
│   ├── client/
│   │   ├── memory.ts     # HTTP client for Memory API
│   │   └── index.ts
│   ├── tools/
│   │   ├── schemas.ts    # Zod schemas for tool inputs
│   │   ├── search.ts     # Search memories tool
│   │   ├── memory.ts     # Add memory tool
│   │   ├── health.ts     # Health check tool
│   │   └── index.ts
│   └── schemas/
│       ├── search.ts     # API response schemas
│       ├── memory.ts     # API request/response schemas
│       └── index.ts
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
