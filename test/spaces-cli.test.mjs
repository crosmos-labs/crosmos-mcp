import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

const testDir = mkdtempSync(join(tmpdir(), "crosmos-spaces-"));
const configPath = join(testDir, "config.json");

const spaces = [
  {
    id: "019dbeea-d9c8-7f51-912b-08a946273328",
    org_id: "019dbeea-d9c8-7f51-912b-08a946273329",
    name: "default",
    description: "Default memory space",
    meta: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "019dc652-2714-76d3-ab4b-1b0d077019b5",
    org_id: "019dbeea-d9c8-7f51-912b-08a946273329",
    name: "cool space",
    description: "A second space",
    meta: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

let server;
let baseUrl;

function runCli(args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      CROSMOS_API_BASE_URL: baseUrl,
      CROSMOS_API_KEY: "test-key",
      CROSMOS_CONFIG_DIR: testDir,
      ...extraEnv,
    };
    Reflect.deleteProperty(env, "DEFAULT_SPACE_ID");
    Reflect.deleteProperty(env, "DEFAULT_SPACE_NAME");
    Object.assign(env, extraEnv);

    const child = spawn(process.execPath, ["dist/stdio.js", ...args], { env });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

before(
  () =>
    new Promise((resolve, reject) => {
      server = createServer((request, response) => {
        if (request.url?.startsWith("/api/v1/spaces")) {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ spaces, total: spaces.length }));
          return;
        }

        response.writeHead(404, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ detail: "Not found" }));
      });
      server.once("error", reject);
      server.listen(0, "127.0.0.1", () => {
        server.off("error", reject);
        const address = server.address();
        assert(address && typeof address === "object");
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    })
);

after(
  () =>
    new Promise((resolve, reject) => {
      server.closeAllConnections();
      server.close((error) => {
        rmSync(testDir, { recursive: true, force: true });
        if (error) reject(error);
        else resolve();
      });
    })
);

test("spaces CLI lists, selects by name, and reports the saved default", async () => {
  const listed = await runCli(["spaces", "list"]);
  assert.equal(listed.code, 0);
  assert.match(listed.stdout, /\* default \[019dbeea-d9c8-7f51-912b-08a946273328\]/);
  assert.match(listed.stdout, /cool space \[019dc652-2714-76d3-ab4b-1b0d077019b5\]/);

  const selected = await runCli(["spaces", "use", "cool space"]);
  assert.equal(selected.code, 0);
  assert.match(`${selected.stdout}${selected.stderr}`, /Default space set to cool space/);

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.deepEqual(config.default_space, {
    id: "019dc652-2714-76d3-ab4b-1b0d077019b5",
    name: "cool space",
  });

  const current = await runCli(["spaces", "current"]);
  assert.equal(current.code, 0);
  assert.match(current.stdout, /cool space \[019dc652-2714-76d3-ab4b-1b0d077019b5\]/);
  assert.match(current.stdout, /Source: saved config/);
});

test("spaces CLI selects by ID", async () => {
  const selected = await runCli(["spaces", "use", "019dbeea-d9c8-7f51-912b-08a946273328"]);
  assert.equal(selected.code, 0);

  const config = JSON.parse(readFileSync(configPath, "utf8"));
  assert.equal(config.default_space.id, "019dbeea-d9c8-7f51-912b-08a946273328");
  assert.equal(config.default_space.name, "default");
});

test("running memory clients reread a changed saved default", async () => {
  const previousConfigDir = process.env.CROSMOS_CONFIG_DIR;
  const previousDefaultId = process.env.DEFAULT_SPACE_ID;
  const previousDefaultName = process.env.DEFAULT_SPACE_NAME;
  process.env.CROSMOS_CONFIG_DIR = testDir;
  Reflect.deleteProperty(process.env, "DEFAULT_SPACE_ID");
  Reflect.deleteProperty(process.env, "DEFAULT_SPACE_NAME");

  try {
    const { MemoryClient } = await import("../dist/client/memory.js");
    const client = new MemoryClient(baseUrl, 5_000, "test-key");

    writeFileSync(
      configPath,
      `${JSON.stringify({ default_space: { id: spaces[0].id, name: spaces[0].name } })}\n`
    );
    assert.equal(await client.resolveSpaceId(undefined), spaces[0].id);

    writeFileSync(
      configPath,
      `${JSON.stringify({ default_space: { id: spaces[1].id, name: spaces[1].name } })}\n`
    );
    assert.equal(await client.resolveSpaceId(undefined), spaces[1].id);
  } finally {
    if (previousConfigDir === undefined) Reflect.deleteProperty(process.env, "CROSMOS_CONFIG_DIR");
    else process.env.CROSMOS_CONFIG_DIR = previousConfigDir;
    if (previousDefaultId === undefined) Reflect.deleteProperty(process.env, "DEFAULT_SPACE_ID");
    else process.env.DEFAULT_SPACE_ID = previousDefaultId;
    if (previousDefaultName === undefined)
      Reflect.deleteProperty(process.env, "DEFAULT_SPACE_NAME");
    else process.env.DEFAULT_SPACE_NAME = previousDefaultName;
  }
});

test("invalid saved config is not overwritten", async () => {
  writeFileSync(configPath, "{ invalid json\n");
  const result = await runCli(["spaces", "use", "default"]);

  assert.equal(result.code, 1);
  assert.match(`${result.stdout}${result.stderr}`, /Invalid JSON in crosmos config/);
  assert.equal(readFileSync(configPath, "utf8"), "{ invalid json\n");
});
