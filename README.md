# crosmos MCP

Give your AI assistant memory that carries across conversations.

crosmos connects to Codex, Claude, Cursor, and other MCP-compatible clients. Your assistant can save
useful facts, preferences, and decisions, then recall them when they become relevant.

## Quick start

Before you begin, install [Node.js 18 or newer](https://nodejs.org/) and create an API key in the
[crosmos console](https://console.crosmos.dev/).

Run the guided setup:

```bash
npx @crosmos/crosmos-mcp setup
```

The setup assistant will:

1. Authenticate your crosmos account.
2. Let you choose a default memory space.
3. Detect and configure supported AI clients.
4. Install the crosmos skill for supported agents.

No global package installation is required. Restart your AI client after setup, then ask it to
remember something.

The guided setup supports Codex, Claude Desktop, Claude Code, Cursor, opencode, VS Code, Windsurf,
Cline, Roo-Cline, Zed, and Kimi CLI. If your client is not detected, use the manual setup below.

### Confirm it works

After restarting your client, start a new conversation and say:

```text
Remember that my favorite editor is Neovim.
```

Then ask:

```text
What is my favorite editor?
```

New memories may take a moment to become available. If the first recall misses, wait briefly and ask
again.

## Using crosmos

Once connected, use natural language:

```text
Remember that we chose PostgreSQL for the analytics service.
```

```text
What did we decide about the analytics database?
```

```text
Use the Product Team space for this conversation.
```

The installed skill teaches your agent when to save durable context and when to recall it. You can
also ask it to switch spaces whenever you want to keep contexts separate.

## Choose where memories are stored

Spaces keep memory for different people, projects, or agents separate. The setup assistant lets you
choose a default, and you can change it at any time by name or ID:

```bash
npx @crosmos/crosmos-mcp spaces list
npx @crosmos/crosmos-mcp spaces current
npx @crosmos/crosmos-mcp spaces use "Product Team"
npx @crosmos/crosmos-mcp spaces use 019dc652-2714-76d3-ab4b-1b0d077019b5
```

The selected space becomes the default for future memory operations. Running MCP clients pick up
space changes automatically.

## Manual setup

The guided setup is recommended. Use these steps only when you want to configure a client yourself
or when automatic detection does not find it.

### 1. Authenticate

```bash
npx @crosmos/crosmos-mcp auth login
```

Credentials are stored locally in `~/.crosmos/credentials.json`. For managed environments, provide
the API key through `CROSMOS_API_KEY` instead:

```bash
export CROSMOS_API_KEY=csk_your_api_key_here
```

Custom deployments can also set `CROSMOS_API_BASE_URL`.

### 2. Add the MCP server

<details>
<summary>Codex</summary>

```bash
codex mcp add crosmos -- npx -y @crosmos/crosmos-mcp
```

</details>

<details>
<summary>Claude Code</summary>

```bash
claude mcp add crosmos -- npx -y @crosmos/crosmos-mcp
```

</details>

<details>
<summary>Kimi CLI</summary>

```bash
kimi mcp add --transport stdio crosmos -- npx -y @crosmos/crosmos-mcp
```

</details>

<details>
<summary>Claude Desktop, Cursor, and Windsurf</summary>

Add this server entry to the client's MCP configuration.

Common configuration locations:

- Claude Desktop:
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Linux: `~/.config/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Cursor: `~/.cursor/mcp.json`
- Windsurf: `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "crosmos": {
      "command": "npx",
      "args": ["-y", "@crosmos/crosmos-mcp"]
    }
  }
}
```

</details>

<details>
<summary>VS Code</summary>

Add this entry to your VS Code MCP configuration:

- macOS: `~/Library/Application Support/Code/User/mcp.json`
- Linux: `~/.config/Code/User/mcp.json`
- Windows: `%APPDATA%\Code\User\mcp.json`

```json
{
  "servers": {
    "crosmos": {
      "command": "npx",
      "args": ["-y", "@crosmos/crosmos-mcp"]
    }
  }
}
```

</details>

<details>
<summary>opencode</summary>

Add this entry to `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "crosmos": {
      "type": "local",
      "command": ["npx", "-y", "@crosmos/crosmos-mcp"]
    }
  }
}
```

</details>

<details>
<summary>Other MCP clients</summary>

Configure a local stdio MCP server with:

- Name: `crosmos`
- Command: `npx`
- Arguments: `-y`, `@crosmos/crosmos-mcp`

</details>

The guided setup also detects Cline, Roo-Cline, Zed, and other supported local clients.

### 3. Install the agent skill

The skill is optional but recommended because it teaches agents when and how to use persistent
memory.

```bash
npx @crosmos/crosmos-mcp skill install codex
```

Replace `codex` with your client. Supported values are `codex`, `claude-code`, `opencode`, `cursor`,
`windsurf`, `vscode`, and `kimi-cli`.

Restart the client after changing its MCP or skill configuration.

## Common commands

All commands below work without a global installation.

| Task | Command |
|---|---|
| Run guided setup | `npx @crosmos/crosmos-mcp setup` |
| Sign in with an API key | `npx @crosmos/crosmos-mcp auth login` |
| Check authentication | `npx @crosmos/crosmos-mcp auth status` |
| Remove locally stored credentials | `npx @crosmos/crosmos-mcp auth logout` |
| List memory spaces | `npx @crosmos/crosmos-mcp spaces list` |
| Show the default space | `npx @crosmos/crosmos-mcp spaces current` |
| Change the default space | `npx @crosmos/crosmos-mcp spaces use <name-or-id>` |
| Install an agent skill | `npx @crosmos/crosmos-mcp skill install <client>` |

## Troubleshooting

### My client does not show crosmos

Restart the client and check its MCP server list. Confirm the registration is named `crosmos` and
that its command is `npx -y @crosmos/crosmos-mcp`.

Older installations may still be registered as `crosmos-memory`. Remove the old entry before adding
the current server.

### Authentication is failing

Check the saved authentication state:

```bash
npx @crosmos/crosmos-mcp auth status
```

If needed, sign in again with `npx @crosmos/crosmos-mcp auth login` and confirm the API key is active
in the [crosmos console](https://console.crosmos.dev/).

### Memories are going to the wrong space

Check the current default:

```bash
npx @crosmos/crosmos-mcp spaces current
```

Use `npx @crosmos/crosmos-mcp spaces list` to see available spaces, then select one with `spaces use`.

### No spaces are available

Create a space in the [crosmos console](https://console.crosmos.dev/), then run:

```bash
npx @crosmos/crosmos-mcp spaces list
```

If you are still stuck, [open an issue](https://github.com/crosmos-org/crosmos-mcp/issues) with your
client name and the error message. Never include your API key.

## License

MIT
