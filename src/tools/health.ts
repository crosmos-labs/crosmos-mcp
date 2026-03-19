import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { memoryClient } from "../client/index.js";

export const healthToolDefinition: Tool = {
  name: "health_check",
  description: "Check the health status of the Crosmos Memory Engine API",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

export async function handleHealth(): Promise<{ status: string }> {
  return memoryClient.health();
}

export function formatHealthResult(response: { status: string }): string {
  return `Crosmos Memory Engine status: ${response.status}`;
}
