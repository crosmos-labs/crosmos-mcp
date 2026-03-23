export interface ApiEndpoints {
  baseUrl: string;
  timeout: number;
  apiKey: string | undefined;
  routes: {
    search: string;
    memoryAdd: string;
    health: string;
    spaces: string;
  };
}

export interface OAuthEndpoints {
  authorizationUrl: string;
  tokenUrl: string;
  registrationUrl: string;
}

const createEndpoints = (baseUrl: string, timeout = 30000, apiKey?: string): ApiEndpoints => ({
  baseUrl: baseUrl.replace(/\/$/, ""),
  timeout,
  apiKey,
  routes: {
    search: "/api/v1/search",
    memoryAdd: "/api/v1/memory/add",
    health: "/health",
    spaces: "/api/v1/spaces",
  },
});

const apiBaseUrl = (process.env.CROSMOS_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export const config = {
  api: createEndpoints(
    apiBaseUrl,
    Number.parseInt(process.env.CROSMOS_API_TIMEOUT || "30000", 10),
    process.env.CROSMOS_API_KEY
  ),
  oauth: {
    authorizationUrl: `${apiBaseUrl}/oauth/authorize`,
    tokenUrl: `${apiBaseUrl}/oauth/token`,
    registrationUrl: `${apiBaseUrl}/oauth/register`,
  } satisfies OAuthEndpoints,
  defaults: {
    spaceId: Number.parseInt(process.env.DEFAULT_SPACE_ID || "1", 10),
  },
};

export const buildUrl = (endpoint: ApiEndpoints, route: keyof ApiEndpoints["routes"]): string => {
  return `${endpoint.baseUrl}${endpoint.routes[route]}`;
};
