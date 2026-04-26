# Crosmos MCP Server

> **Beta** — Crosmos is in early access. APIs and features may change. Feedback welcome at [github.com/crosmos-org/crosmos-mcp](https://github.com/crosmos-org/crosmos-mcp).

MCP server for the Crosmos Memory Engine — persistent memory with semantic, keyword, and graph retrieval for AI agents.

## Tools

| Tool | Description |
|------|-------------|
| `crosmos_search_memories` | Hybrid retrieval (semantic + keyword + graph) |
| `crosmos_add_memory` | Store content with auto entity/relation extraction |
| `crosmos_list_spaces` | List available memory spaces |
| `crosmos_health_check` | Verify API connectivity and status |

## Quick Start

```bash
npx @crosmos/mcp-server setup
```

This runs the interactive setup:

1. **Authenticate** — Enter your API key (get one at [console.crosmos.dev](https://console.crosmos.dev/))
2. **Install skill** — Auto-detects your AI editor(s) and installs the Crosmos skill

## Manual Setup

### 1. Install

```bash
npm install -g @crosmos/mcp-server
```

### 2. Authenticate

```bash
crosmos-mcp auth login
```

Or set the environment variable:

```bash
export CROSMOS_API_KEY=csk_your_api_key_here
```

### 3. Configure your client

<details>
<summary>Claude Code</summary>

```bash
claude mcp add crosmos-memory -- crosmos-mcp
```

The API key from `auth login` is picked up automatically. No env vars needed.

</details>

<details>
<summary>Claude Desktop</summary>

Config location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "crosmos-memory": {
      "command": "crosmos-mcp",
      "env": {
        "CROSMOS_API_KEY": "csk_your_api_key_here"
      }
    }
  }
}
```

</details>

<details>
<summary>opencode</summary>

`~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "crosmos-memory": {
      "type": "local",
      "command": ["node", "/path/to/crosmos-mcp/dist/stdio.js"]
    }
  }
}
```

The API key from `auth login` is picked up automatically.

</details>

<details>
<summary>Other MCP clients</summary>

The server uses stdio transport. Point your client to `crosmos-mcp` and set:

| Variable | Value |
|----------|-------|
| `CROSMOS_API_KEY` | Your API key (`csk_...`) |
| `CROSMOS_API_BASE_URL` | `https://api.crosmos.dev` (default) |

</details>

### 4. (Optional) Install the skill

```bash
crosmos-mcp skill install opencode    # or: cursor, claude-code, windsurf, vscode
```

## CLI Reference

```bash
crosmos-mcp                          # Start MCP server (stdio)
crosmos-mcp setup                    # Interactive setup (auth + skill)
crosmos-mcp auth login               # Authenticate with API key
crosmos-mcp auth login --base-url URL # Custom API base URL
crosmos-mcp auth logout              # Remove stored credentials
crosmos-mcp auth status              # Show auth state
crosmos-mcp skill install <client>   # Install Crosmos skill
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CROSMOS_API_KEY` | API key (overrides credentials file) | — |
| `CROSMOS_API_BASE_URL` | API base URL | `https://api.crosmos.dev` |
| `CROSMOS_API_TIMEOUT` | Request timeout (ms) | `30000` |
| `DEFAULT_SPACE_ID` | Default memory space | `1` |

Credential resolution order: `CROSMOS_API_KEY` env var → `~/.crosmos/credentials.json` → error.

## Postinstall Script

After `npm install`, `dist/postinstall.js` runs automatically. It:

1. In a TTY: launches the interactive setup (auth + skill install)
2. In non-TTY (CI, Docker): prints a hint to run `npx @crosmos/mcp-server setup`

Credentials are stored at `~/.crosmos/credentials.json` (mode `0600`).

The source is at [`src/postinstall.ts`](src/postinstall.ts) — feel free to audit it.

## Development

```bash
npm run dev          # stdio mode with watch
npm run dev:http     # HTTP mode with watch
npm run build        # compile TypeScript
npm run lint         # biome check
npm run format       # biome format
```

## License

MIT