import assert from "node:assert/strict";
import { test } from "node:test";
import { formatSearchResult } from "../dist/tools/search.js";

test("search results omit internal score and memory type", () => {
  const output = formatSearchResult({
    query: "preferred editor",
    candidates: [
      {
        memory_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        content: "The user prefers Neovim.",
        memory_type: "viewpoint",
        score: 0.9512,
        source: null,
        created_at: "2026-01-01T00:00:00.000Z",
        event_time: "2026-01-01T00:00:00.000Z",
        owner_name: "Rachit Srivastava",
      },
    ],
  });

  assert.equal(
    output,
    'Found 1 memories for "preferred editor":\n\n1. (event: 2026-01-01T00:00:00.000Z) (owner: Rachit Srivastava)\n   The user prefers Neovim.'
  );
  assert.doesNotMatch(output, /score:/);
  assert.doesNotMatch(output, /type:/);
});
