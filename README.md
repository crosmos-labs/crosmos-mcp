# Crosmos MCP Server

> **Beta** — Crosmos is in early access. APIs and features may change. Feedback welcome at [github.com/crosmos-org/crosmos-mcp](https://github.com/crosmos-org/crosmos-mcp).

MCP server for the Crosmos memory layer.

## Tools

| Tool | Description |
|------|-------------|
| `crosmos_search_memories` | Semantic + keyword + graph retrieval |
| `crosmos_add_memory` | Store content with auto entity/relation extraction |
| `crosmos_list_spaces` | List available memory spaces |
| `crosmos_health_check` | Verify API connectivity and status |

## Quick Start

```bash
npx @crosmos/crosmos-mcp setup
```

This runs the interactive setup:

1. **Authenticate** — Enter your API key (get one at [console.crosmos.dev](https://console.crosmos.dev/))
2. **Install to clients** — Auto-detects installed MCP clients (Claude Desktop, Claude Code, opencode, Cursor, VS Code, Windsurf, Cline, Roo-Cline, Zed) and writes the server config
3. **Install skill** — Auto-detects your AI editor(s) and installs the Crosmos skill

No global install needed — `npx` handles everything. Clients are configured to run `npx -y @crosmos/crosmos-mcp` so they always pick up the latest version.

## Manual Setup

### 1. Authenticate

```bash
npx @crosmos/crosmos-mcp auth login
```

Or set the environment variable:

```bash
export CROSMOS_API_KEY=csk_your_api_key_here
```

### 2. Configure your client

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
      "command": "npx",
      "args": ["-y", "@crosmos/crosmos-mcp"]
    }
  }
}
```

</details>

<details>
<summary>Claude Code</summary>

```bash
claude mcp add crosmos-memory -- npx -y @crosmos/crosmos-mcp
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
      "command": ["npx", "-y", "@crosmos/crosmos-mcp"]
    }
  }
}
```

</details>

<details>
<summary>Cursor</summary>

`~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "crosmos-memory": {
      "command": "npx",
      "args": ["-y", "@crosmos/crosmos-mcp"]
    }
  }
}
```

</details>

<details>
<summary>VS Code</summary>

- **macOS**: `~/Library/Application Support/Code/User/mcp.json`
- **Linux**: `~/.config/Code/User/mcp.json`
- **Windows**: `%APPDATA%\Code\User\mcp.json`

```json
{
  "servers": {
    "crosmos-memory": {
      "command": "npx",
      "args": ["-y", "@crosmos/crosmos-mcp"]
    }
  }
}
```

</details>

<details>
<summary>Windsurf</summary>

`~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "crosmos-memory": {
      "command": "npx",
      "args": ["-y", "@crosmos/crosmos-mcp"]
    }
  }
}
```

</details>

<details>
<summary>Other MCP clients</summary>

The server uses stdio transport. Point your client to `npx -y @crosmos/crosmos-mcp` and set:

| Variable | Value |
|----------|-------|
| `CROSMOS_API_KEY` | Your API key (`csk_...`) |
| `CROSMOS_API_BASE_URL` | `https://api.crosmos.dev` (default) |

</details>

### 3. (Optional) Install the skill

```bash
npx @crosmos/crosmos-mcp skill install opencode    # or: cursor, claude-code, windsurf, vscode
```

## CLI Reference

```bash
npx @crosmos/crosmos-mcp                     # Start MCP server (stdio)
npx @crosmos/crosmos-mcp setup               # Interactive setup (auth + client install + skill)
npx @crosmos/crosmos-mcp auth login          # Authenticate with API key
npx @crosmos/crosmos-mcp auth login --base-url URL # Custom API base URL
npx @crosmos/crosmos-mcp auth logout         # Remove stored credentials
npx @crosmos/crosmos-mcp auth status         # Show auth state
npx @crosmos/crosmos-mcp skill install <client>  # Install Crosmos skill
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CROSMOS_API_KEY` | API key (overrides credentials file) | — |
| `CROSMOS_API_BASE_URL` | API base URL | `https://api.crosmos.dev` |
| `CROSMOS_API_TIMEOUT` | Request timeout (ms) | `30000` |
| `DEFAULT_SPACE_ID` | Default memory space UUID | — |
| `DEFAULT_SPACE_NAME` | Default memory space name (resolved via `/spaces?name=`); ignored if `DEFAULT_SPACE_ID` is set | — |

Credential resolution order: `CROSMOS_API_KEY` env var → `~/.crosmos/credentials.json` → error.

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
