import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";

const SKILL_CONTENT = `---
name: crosmos-memory
description: Crosmos Memory is a Monotonic Temporal Knowledge Graph (MTKG) for AI agents. Use this skill when building applications that need persistent memory with full temporal history, entity-relationship tracking, or hybrid retrieval (semantic + keyword + graph). Perfect for agents that need to understand relationships between entities, track knowledge evolution over time, and retrieve context with deterministic intent classification.
---

# Crosmos Memory — Agent Integration Guide

An agent using Crosmos should **automatically** decide whether to store or retrieve based on user intent. The user should never have to explicitly say "remember this" or "search for X".

## Auto-Intent Rules

### INGEST (add_memory) when the user:
- Shares personal information (preferences, work, relationships, location)
- Tells a story or recounts an experience
- Provides instructions, rules, or standing preferences
- Corrects or updates something previously stated
- Has a multi-turn conversation worth remembering

### SEARCH (search_memories) when the user:
- Asks a question about themselves or past interactions
- Says "what did I", "do I", "do you remember"
- Requests a recommendation based on their preferences
- Refers to something previously discussed
- Asks about relationships between things they've mentioned

### BOTH in the same conversation:
- After ingesting new information, search to provide context-aware responses
- When answering a question, search first, then ingest any new facts that emerged

---

## MCP Tools

### \`crosmos_add_memory\`

Store information into the knowledge graph. The LLM extraction pipeline handles entity and relationship extraction automatically.

**When**: User shares facts, preferences, experiences, or conversation context.

\`\`\`json
{
  "space_id": "<from list_spaces>",
  "sources": [
    {"content": "User prefers dark mode and uses Neovim as their primary editor"}
  ]
}
\`\`\`

### \`crosmos_search_memories\`

Retrieve relevant memories using hybrid search (semantic + keyword + graph).

**When**: User asks about themselves, past preferences, or anything requiring memory context.

\`\`\`json
{
  "query": "What editor does the user prefer?",
  "space_id": "<from list_spaces>"
}
\`\`\`

### \`crosmos_list_spaces\`

List all memory spaces. Call this first if you don't have a space_id yet.

\`\`\`json
{}
\`\`\`

### \`crosmos_health_check\`

Verify the API is operational.

\`\`\`json
{}
\`\`\`

---

## Conversation Flow

1. Receive user message
2. Search memories for relevant context → search_memories
3. Generate response using retrieved context
4. If new facts emerged → add_memory (ingest conversation turn)

### Single-turn ingest:
User: "I work at Anthropic on Claude safety"
Agent: add_memory → store the fact
Agent: "Got it, I'll remember you work at Anthropic."

### Question-answering:
User: "What editor do I use?"
Agent: search_memories → finds "User prefers Neovim"
Agent: "You prefer Neovim as your primary editor."

### Correcting facts (monotonic — new edges, no deletion):
User: "I switched from VS Code to Neovim"
Agent: add_memory → new edge (USER USES Neovim) with valid_from
       The old edge (USER USES VS Code) remains but with temporal context
Agent: "Updated! You now use Neovim."

---

## Key Concepts

### Monotonic Temporal Knowledge Graph
The graph only grows: G(t+1) = G(t) ∪ Δ. No updates, no deletions. Knowledge corrections create new edges with temporal context, not replacements.

### Hybrid Retrieval Pipeline
Four parallel signals fused via Reciprocal Rank Fusion:
1. **Semantic** — HNSW vector similarity
2. **Keyword** — PostgreSQL fulltext (GIN + ts_rank_cd, OR logic with stopword filtering)
3. **Graph** — 3-seed BFS traversal through entity relationships
4. **Temporal** — Event-time-aware recency boost

### Entity Resolution
3-stage: embedding pre-filter → rapidfuzz deterministic → casefold name dedup (first-wins).
`;

export type ClientId = "opencode" | "cursor" | "claude-code" | "windsurf" | "vscode";

interface ClientConfig {
  name: string;
  skillDir: string;
  detectPaths: string[];
}

const HOME = homedir();

const CLIENT_CONFIGS: Record<ClientId, ClientConfig> = {
  opencode: {
    name: "opencode",
    skillDir: join(HOME, ".opencode", "skills", "crosmos"),
    detectPaths: [join(HOME, ".opencode")],
  },
  "claude-code": {
    name: "Claude Code",
    skillDir: join(HOME, ".claude", "skills", "crosmos"),
    detectPaths: [join(HOME, ".claude")],
  },
  cursor: {
    name: "Cursor",
    skillDir: join(HOME, ".cursor", "skills", "crosmos"),
    detectPaths: [join(HOME, ".cursor")],
  },
  windsurf: {
    name: "Windsurf",
    skillDir: join(HOME, ".windsurf", "rules"),
    detectPaths: [join(HOME, ".windsurf")],
  },
  vscode: {
    name: "VS Code",
    skillDir: join(HOME, ".vscode", "skills", "crosmos"),
    detectPaths: [
      join(HOME, ".vscode"),
      "/usr/bin/code",
      "/snap/bin/code",
      "/Applications/Visual Studio Code.app",
      join(HOME, "AppData", "Local", "Programs", "Microsoft VS Code"),
    ],
  },
};

const CLIENT_ORDER: ClientId[] = ["opencode", "claude-code", "cursor", "windsurf", "vscode"];

export function getAvailableClients(): ClientId[] {
  return [...CLIENT_ORDER];
}

export function detectInstalledClients(): ClientId[] {
  return CLIENT_ORDER.filter((id) => {
    const config = CLIENT_CONFIGS[id];
    return config.detectPaths.some((p) => existsSync(p));
  });
}

export function resolveClientDir(client: string): string | undefined {
  if (client in CLIENT_CONFIGS) {
    return CLIENT_CONFIGS[client as ClientId].skillDir;
  }
  return undefined;
}

export function installSkill(client: ClientId): "installed" | "already_exists" {
  const config = CLIENT_CONFIGS[client];
  if (!config) throw new Error(`Unknown client: ${client}`);

  if (!existsSync(config.skillDir)) {
    mkdirSync(config.skillDir, { recursive: true });
  }

  const skillPath = join(config.skillDir, "SKILL.md");

  if (existsSync(skillPath)) {
    const existing = readFileSync(skillPath, "utf-8");
    if (existing === SKILL_CONTENT) {
      return "already_exists";
    }
  }

  writeFileSync(skillPath, SKILL_CONTENT);
  return "installed";
}

export function getClientName(client: ClientId): string {
  return CLIENT_CONFIGS[client].name;
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function promptSkillInstall(): Promise<void> {
  const detected = detectInstalledClients();

  if (detected.length === 0) {
    process.stderr.write("No supported clients detected on this system.\n");
    process.stderr.write("Available clients: opencode, claude-code, cursor, windsurf, vscode\n\n");
    process.stderr.write("Run `crosmos-mcp skill install <client>` to install manually.\n");
    return;
  }

  process.stderr.write("Which clients should the Crosmos skill be installed for?\n\n");

  const choices: { id: ClientId; selected: boolean }[] = CLIENT_ORDER.map((id) => ({
    id,
    selected: detected.includes(id),
  }));

  for (let i = 0; i < choices.length; i++) {
    const { id, selected } = choices[i];
    const config = CLIENT_CONFIGS[id];
    const detected标记 = detected.includes(id) ? "(detected)" : "";
    const check = selected ? "[x]" : "[ ]";
    process.stderr.write(`  ${i + 1}. ${check} ${config.name} ${detected标记}\n`);
  }

  process.stderr.write(
    "\nEnter numbers to toggle (e.g. '1 3 5'), or press Enter to accept defaults:\n"
  );

  const answer = await prompt("> ");

  if (answer) {
    const toggled = answer
      .split(/\s+/)
      .map((n) => Number.parseInt(n, 10) - 1)
      .filter((n) => !Number.isNaN(n) && n >= 0 && n < choices.length);

    if (toggled.length > 0) {
      for (const idx of choices.keys()) {
        choices[idx].selected = false;
      }
      for (const idx of toggled) {
        choices[idx].selected = true;
      }
    }
  }

  process.stderr.write("\n");

  for (const choice of choices) {
    if (!choice.selected) continue;
    const result = installSkill(choice.id);
    const config = CLIENT_CONFIGS[choice.id];
    if (result === "already_exists") {
      process.stderr.write(`  ✓ ${config.name} — skill already installed\n`);
    } else {
      process.stderr.write(`  ✓ ${config.name} — skill installed at ${config.skillDir}/SKILL.md\n`);
    }
  }

  process.stderr.write("\n");
}
