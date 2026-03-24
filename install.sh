#!/usr/bin/env bash
set -euo pipefail

# ── Crosmos MCP installer ─────────────────────────────────────────────
# Usage: curl -fsSL https://mcp.iiviie.dev/install.sh | bash
#    or: curl -fsSL https://mcp.iiviie.dev/install.sh | bash -s -- --api-key YOUR_KEY
# ───────────────────────────────────────────────────────────────────────

PACKAGE="crosmos-mcp"
TARBALL_URL="https://mcp.iiviie.dev/crosmos-mcp.tgz"
MIN_NODE_VERSION=18

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()  { printf "${CYAN}${BOLD}▸${RESET} %s\n" "$1"; }
ok()    { printf "${GREEN}${BOLD}✓${RESET} %s\n" "$1"; }
warn()  { printf "${YELLOW}${BOLD}!${RESET} %s\n" "$1"; }
fail()  { printf "${RED}${BOLD}✗${RESET} %s\n" "$1" >&2; exit 1; }

# ── Parse args ─────────────────────────────────────────────────────────

API_KEY=""
BASE_URL="https://memory.iiviie.dev"
SPACE_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api-key)  API_KEY="$2"; shift 2 ;;
    --base-url) BASE_URL="$2"; shift 2 ;;
    --space-id) SPACE_ID="$2"; shift 2 ;;
    *)          warn "Unknown option: $1"; shift ;;
  esac
done

# ── Check prerequisites ────────────────────────────────────────────────

printf "\n${BOLD}  Crosmos MCP Installer${RESET}\n\n"

if ! command -v node &>/dev/null; then
  fail "Node.js is not installed. Install Node.js >= ${MIN_NODE_VERSION} first: https://nodejs.org"
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [[ "$NODE_VERSION" -lt "$MIN_NODE_VERSION" ]]; then
  fail "Node.js ${MIN_NODE_VERSION}+ required (found v${NODE_VERSION}). Update at https://nodejs.org"
fi
ok "Node.js v$(node -v | sed 's/v//') detected"

if ! command -v npm &>/dev/null; then
  fail "npm is not installed"
fi
ok "npm $(npm -v) detected"

# ── Download and install ───────────────────────────────────────────────

info "Downloading ${PACKAGE}..."

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

curl -fsSL "${TARBALL_URL}" -o "${TMPDIR}/${PACKAGE}.tgz" \
  || fail "Failed to download package from ${TARBALL_URL}"

ok "Downloaded package"

info "Installing globally..."
npm install -g "${TMPDIR}/${PACKAGE}.tgz" 2>&1 | tail -1

if ! command -v crosmos-mcp &>/dev/null; then
  fail "Installation failed — 'crosmos-mcp' not found in PATH"
fi
ok "Installed ${PACKAGE}"

# ── Configure for Claude Desktop ───────────────────────────────────────

CLAUDE_CONFIG_DIR="${HOME}/.claude"
CLAUDE_MCP_CONFIG="${CLAUDE_CONFIG_DIR}/claude_desktop_config.json"

configure_claude() {
  local env_block="{\"CROSMOS_API_BASE_URL\": \"${BASE_URL}\""
  [[ -n "$API_KEY" ]] && env_block="${env_block}, \"CROSMOS_API_KEY\": \"${API_KEY}\""
  [[ -n "$SPACE_ID" ]] && env_block="${env_block}, \"DEFAULT_SPACE_ID\": \"${SPACE_ID}\""
  env_block="${env_block}}"

  local mcp_entry
  mcp_entry=$(cat <<EOF
{
  "mcpServers": {
    "crosmos-memory": {
      "command": "crosmos-mcp",
      "env": ${env_block}
    }
  }
}
EOF
)

  mkdir -p "${CLAUDE_CONFIG_DIR}"

  if [[ -f "$CLAUDE_MCP_CONFIG" ]]; then
    if grep -q "crosmos-memory" "$CLAUDE_MCP_CONFIG" 2>/dev/null; then
      warn "Claude Desktop config already has crosmos-memory entry — skipping"
      return
    fi

    node -e "
      const fs = require('fs');
      const existing = JSON.parse(fs.readFileSync('${CLAUDE_MCP_CONFIG}', 'utf8'));
      existing.mcpServers = existing.mcpServers || {};
      existing.mcpServers['crosmos-memory'] = ${mcp_entry//$'\n'/}.mcpServers['crosmos-memory'];
      fs.writeFileSync('${CLAUDE_MCP_CONFIG}', JSON.stringify(existing, null, 2) + '\n');
    " 2>/dev/null && ok "Updated Claude Desktop config" || warn "Could not update Claude Desktop config — add manually"
  else
    echo "${mcp_entry}" > "$CLAUDE_MCP_CONFIG"
    ok "Created Claude Desktop config at ${CLAUDE_MCP_CONFIG}"
  fi
}

configure_claude

# ── Done ───────────────────────────────────────────────────────────────

printf "\n${GREEN}${BOLD}  Installation complete!${RESET}\n\n"

if [[ -n "$API_KEY" ]]; then
  printf "  The MCP server is configured and ready to use.\n"
  printf "  Restart Claude Desktop or your editor to activate.\n"
else
  printf "  Next steps:\n"
  printf "    1. Get an API key:  Sign in at ${BOLD}${BASE_URL}${RESET}\n"
  printf "    2. Re-run with key: ${BOLD}curl -fsSL https://mcp.iiviie.dev/install.sh | bash -s -- --api-key YOUR_KEY${RESET}\n"
  printf "    3. Or set manually: Add CROSMOS_API_KEY to your MCP server config\n"
fi

printf "\n  Docs: ${CYAN}https://github.com/crosmos-org/crosmos-mcp${RESET}\n\n"
