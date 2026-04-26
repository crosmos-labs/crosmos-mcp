import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import * as p from "./clack.js";

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

### \\\`crosmos_add_memory\\\`

Store information into the knowledge graph. The LLM extraction pipeline handles entity and relationship extraction automatically.

**When**: User shares facts, preferences, experiences, or conversation context.

\\\`\\\`\\\`json
{
  "space_id": 1,
  "sources": [
    {"content": "User prefers dark mode and uses Neovim as their primary editor"}
  ]
}
\\\`\\\`\\\`

For multi-turn conversations, use the messages format:

\\\`\\\`\\\`json
{
  "space_id": 1,
  "messages": [
    {"role": "user", "content": "I just got back from Tokyo"},
    {"role": "assistant", "content": "How was it?"},
    {"role": "user", "content": "Amazing, I visited Shibuya and ate at Ichiran ramen"}
  ],
  "session_id": "tokyo-trip-2024"
}
\\\`\\\`\\\`

### \\\`crosmos_search_memories\\\`

Retrieve relevant memories using hybrid search (semantic + keyword + graph).

**When**: User asks about themselves, past preferences, or anything requiring memory context.

\\\`\\\`\\\`json
{
  "query": "What editor does the user prefer?",
  "space_id": 1
}
\\\`\\\`\\\`

Optional parameters:
- \\\`limit\\\` (1-50, default 10): Number of results
- \\\`rerank\\\` (boolean, default true): Cross-encoder reranking for precision
- \\\`graph\\\` (boolean, default true): Include graph traversal signal (disable for faster keyword+semantic only)

### \\\`crosmos_list_spaces\\\`

List all memory spaces the user has access to.

\\\`\\\`\\\`json
{}
\\\`\\\`\\\`

### \\\`crosmos_health_check\\\`

Verify the API is operational.

\\\`\\\`\\\`json
{}
\\\`\\\`\\\`

---

## API Endpoints

### Ingestion

| Endpoint | Method | Purpose |
|----------|--------|---------|
| \\\`/api/v1/sources\\\` | POST | Ingest raw content (text, markdown). Returns \\\`job_id\\\` for async processing. |
| \\\`/api/v1/conversations\\\` | POST | Ingest multi-turn conversations with auto-segmentation and lookback. Returns \\\`job_id\\\`. |
| \\\`/api/v1/jobs/{job_id}\\\` | GET | Poll ingestion job status. |

### Retrieval & Exploration

| Endpoint | Method | Purpose |
|----------|--------|---------|
| \\\`/api/v1/search\\\` | POST | Hybrid retrieval (semantic + keyword + graph). Returns scored candidates with \\\`total\\\` and \\\`took_ms\\\`. |
| \\\`/api/v1/entities\\\` | GET | List/search entities with edge counts. |
| \\\`/api/v1/entities/{id}\\\` | GET | Entity detail with recent memories. |
| \\\`/api/v1/graph\\\` | GET | Graph viewport — nodes + edges for visualization. |
| \\\`/api/v1/graph/stats\\\` | GET | Entity type distribution, top relations, totals. |

### Memory Management

| Endpoint | Method | Purpose |
|----------|--------|---------|
| \\\`/api/v1/spaces\\\` | POST | Create memory space |
| \\\`/api/v1/spaces\\\` | GET | List all spaces |
| \\\`/api/v1/spaces/{id}\\\` | GET | Get space details |
| \\\`/api/v1/spaces/{id}\\\` | DELETE | Delete space and all contents |
| \\\`/api/v1/memories?space_id=X\\\` | GET | List memories in a space |
| \\\`/api/v1/memories/{id}\\\` | GET | Get memory by ID |
| \\\`/api/v1/memories/{id}\\\` | DELETE | Soft-delete a memory |

---

## Conversation Flow

### Typical agent loop:

\\\`\\\`\\\`
1. Receive user message
2. Search memories for relevant context → search_memories
3. Generate response using retrieved context
4. If new facts emerged → add_memory (ingest conversation turn)
\\\`\\\`\\\`

### Single-turn ingest:
\\\`\\\`\\\`
User: "I work at Anthropic on Claude safety"
Agent: add_memory → store the fact
Agent: "Got it, I'll remember you work at Anthropic."
\\\`\\\`\\\`

### Question-answering:
\\\`\\\`\\\`
User: "What editor do I use?"
Agent: search_memories → finds "User prefers Neovim"
Agent: "You prefer Neovim as your primary editor."
\\\`\\\`\\\`

### Correcting facts (monotonic — new edges, no deletion):
\\\`\\\`\\\`
User: "I switched from VS Code to Neovim"
Agent: add_memory → new edge (USER USES Neovim) with valid_from
       The old edge (USER USES VS Code) remains but with temporal context
Agent: "Updated! You now use Neovim."
\\\`\\\`\\\`

---

## Search Response Format

\\\`\\\`\\\`json
{
  "query": "what editor does the user prefer",
  "candidates": [
    {
      "memory_id": 123,
      "content": "User prefers dark mode in all editors and uses Neovim as primary editor",
      "memory_type": "viewpoint",
      "score": 0.95,
      "created_at": "2024-03-15T10:30:00Z",
      "recorded_at": "2024-03-15T10:30:00Z",
      "event_time": null
    }
  ],
  "total": 5,
  "took_ms": 120.5
}
\\\`\\\`\\\`

---

## Data Model

\\\`\\\`\\\`
MemorySpace (Container)
    ├── Sources (raw content: text, markdown, conversations)
    │       ├── content_type: text | markdown | html | json | pdf | ...
    │       ├── sequence: int (order within batch)
    │       └── meta: JSONB (session_id, lookback_context, etc.)
    │
    ├── Memories (atomic facts)
    │       ├── memory_type: viewpoint | semantic | episode | inference
    │       ├── importance_score: 0.3 (minor) → 0.9 (identity-defining)
    │       ├── event_time: when the event occurred (ISO8601)
    │       ├── recorded_at: when the memory was stored
    │       ├── forgotten_at: nullable (soft delete)
    │       └── SourceMemory (junction: memory → source)
    │
    ├── Entities (graph nodes)
    │       ├── name: canonical name (casefold dedup)
    │       ├── entity_type: person | organization | technology | project | location | object | concept
    │       ├── embedding: 1536-dim vector for semantic search
    │       └── MemoryEntity (junction: memory → entity)
    │
    └── Edges (ERE relations)
            ├── source_entity → target_entity
            ├── relation_type: WORKS_FOR | PREFERS | LIKES | DISLIKES | USES | VISITED | ...
            ├── confidence: 0.0–1.0
            ├── valid_from: when the relation became true
            └── recorded_at: when the edge was created
\\\`\\\`\\\`

---

## Key Concepts

### Monotonic Temporal Knowledge Graph
The graph only grows: \\\`G(t+1) = G(t) ∪ Δ\\\`. No updates, no deletions. Knowledge corrections create new edges with temporal context, not replacements.

### Hybrid Retrieval Pipeline
Four parallel signals fused via Reciprocal Rank Fusion:
1. **Semantic** — HNSW vector similarity
2. **Keyword** — PostgreSQL fulltext (GIN + ts_rank_cd, OR logic with stopword filtering)
3. **Graph** — 3-seed BFS traversal through entity relationships
4. **Temporal** — Event-time-aware recency boost

### Extraction Pipeline
Content → Segment (conversations) → Extract memories/entities/relations (LLM) → Resolve entities (3-stage: embedding → fuzzy → dedup) → Create edges → Embed and store.

### Entity Resolution
3-stage: embedding pre-filter → rapidfuzz deterministic → casefold name dedup (first-wins).

---

## Best Practices

1. **One space per user** for personal assistants; one space per project for team agents
2. **Use conversations endpoint** for multi-turn chats — it handles segmentation and lookback automatically
3. **Include session_date** for temporal reasoning — the system extracts relative dates to absolute timestamps
4. **Poll job status after ingestion** — extraction is async, wait for \\\`status: "completed"\\\` before searching
5. **Set \\\`graph: false\\\`** on search if you only need keyword+semantic for faster results
6. **Soft-delete memories** via DELETE — they get \\\`forgotten_at\\\` set, excluded from retrieval but preserved in the graph
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

export async function promptSkillInstall(): Promise<void> {
  const detected = detectInstalledClients();

  const selectedClients = await p.multiselect({
    message: "Install Crosmos skill for:",
    options: CLIENT_ORDER.map((id) => {
      const config = CLIENT_CONFIGS[id];
      const isDetected = detected.includes(id);
      return {
        value: id,
        label: config.name,
        hint: isDetected ? "detected" : undefined,
      };
    }),
    initialValues: detected,
    required: false,
  });

  if (
    p.isCancel(selectedClients) ||
    !Array.isArray(selectedClients) ||
    selectedClients.length === 0
  ) {
    p.log.info("Skipped skill installation. Run `crosmos-mcp skill install <client>` anytime.");
    return;
  }

  for (const item of selectedClients) {
    const clientId = item.value as ClientId;
    const config = CLIENT_CONFIGS[clientId];
    const result = installSkill(clientId);
    if (result === "already_exists") {
      p.log.success(`${config.name} — already installed`);
    } else {
      p.log.success(`${config.name} — installed`);
    }
  }
}
