export interface ApiEndpoints {
  baseUrl: string;
  timeout: number;
  routes: {
    search: string;
    memoryAdd: string;
    health: string;
  };
}

const createEndpoints = (baseUrl: string, timeout = 30000): ApiEndpoints => ({
  baseUrl: baseUrl.replace(/\/$/, ""),
  timeout,
  routes: {
    search: "/api/v1/search",
    memoryAdd: "/api/v1/memory/add",
    health: "/health",
  },
});

export const config = {
  api: createEndpoints(
    process.env.CROSMOS_API_BASE_URL || "http://localhost:8000",
    Number.parseInt(process.env.CROSMOS_API_TIMEOUT || "30000", 10)
  ),
  defaults: {
    spaceId: Number.parseInt(process.env.DEFAULT_SPACE_ID || "1", 10),
  },
};

export const buildUrl = (endpoint: ApiEndpoints, route: keyof ApiEndpoints["routes"]): string => {
  return `${endpoint.baseUrl}${endpoint.routes[route]}`;
};
