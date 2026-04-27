import { getApiKey, getBaseUrl } from "../cli/credentials.js";

export interface ApiEndpoints {
  baseUrl: string;
  timeout: number;
  apiKey: string | undefined;
  routes: {
    search: string;
    memoryAdd: string;
    conversations: string;
    health: string;
    spaces: string;
  };
}

export interface AppConfig {
  api: ApiEndpoints;
  defaults: {
    spaceId: string | undefined;
    spaceName: string | undefined;
  };
}

const createEndpoints = (baseUrl: string, timeout = 30000, apiKey?: string): ApiEndpoints => ({
  baseUrl: baseUrl.replace(/\/$/, ""),
  timeout,
  apiKey,
  routes: {
    search: "/api/v1/search",
    memoryAdd: "/api/v1/sources",
    conversations: "/api/v1/conversations",
    health: "/health",
    spaces: "/api/v1/spaces",
  },
});

export function loadConfig(): AppConfig {
  const baseUrl = getBaseUrl();
  const apiKey = getApiKey();
  const timeout = Number.parseInt(process.env.CROSMOS_API_TIMEOUT || "30000", 10);

  return {
    api: createEndpoints(baseUrl, timeout, apiKey),
    defaults: {
      spaceId: process.env.DEFAULT_SPACE_ID || undefined,
      spaceName: process.env.DEFAULT_SPACE_NAME || undefined,
    },
  };
}

export const config: AppConfig = loadConfig();

export const buildUrl = (endpoint: ApiEndpoints, route: keyof ApiEndpoints["routes"]): string => {
  return `${endpoint.baseUrl}${endpoint.routes[route]}`;
};
