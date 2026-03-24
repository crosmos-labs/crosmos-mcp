#!/usr/bin/env bash
set -euo pipefail

# ── Crosmos MCP installer ─────────────────────────────────────────────
# Usage: curl -fsSL https://mcp.iiviie.dev/install.sh | bash
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

# ── Done ───────────────────────────────────────────────────────────────

printf "\n${GREEN}${BOLD}  Installation complete!${RESET}\n\n"
printf "  The ${BOLD}crosmos-mcp${RESET} binary is now available globally.\n\n"
printf "  Next steps:\n"
printf "    1. Add the MCP server to your client of choice (Claude Desktop, Claude Code, opencode, etc.)\n"
printf "    2. See setup examples: ${CYAN}https://github.com/crosmos-org/crosmos-mcp#usage${RESET}\n"
printf "\n"
