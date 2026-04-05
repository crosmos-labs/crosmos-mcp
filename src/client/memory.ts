import { buildUrl, config } from "../config/index.js";
import type {
  AddMemoryRequest,
  AddMemoryResponse,
  SearchRequest,
  SearchResponse,
  SpaceListResponse,
} from "../schemas/index.js";

export class MemoryClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly apiKey: string | undefined;

  constructor(baseUrl?: string, timeout?: number, apiKey?: string) {
    this.baseUrl = baseUrl ?? config.api.baseUrl;
    this.timeout = timeout ?? config.api.timeout;
    this.apiKey = apiKey ?? config.api.apiKey;
  }

  private async request<T>(url: string, options: RequestInit, authToken?: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Per-request auth token takes precedence over static API key
    const token = authToken ?? this.apiKey;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async search(params: SearchRequest, authToken?: string): Promise<SearchResponse> {
    const url = buildUrl(config.api, "search");
    return this.request<SearchResponse>(url, {
      method: "POST",
      body: JSON.stringify(params),
    }, authToken);
  }

  async addMemory(params: AddMemoryRequest, authToken?: string): Promise<AddMemoryResponse> {
    const url = buildUrl(config.api, "memoryAdd");
    return this.request<AddMemoryResponse>(url, {
      method: "POST",
      body: JSON.stringify(params),
    }, authToken);
  }

  async health(authToken?: string): Promise<{ status: string }> {
    const url = buildUrl(config.api, "health");
    return this.request<{ status: string }>(url, {
      method: "GET",
    }, authToken);
  }

  async listSpaces(authToken?: string): Promise<SpaceListResponse> {
    const url = buildUrl(config.api, "spaces");
    return this.request<SpaceListResponse>(url, {
      method: "GET",
    }, authToken);
  }

  async resolveSpaceId(spaceId: number | undefined, authToken?: string): Promise<number> {
    if (spaceId !== undefined) {
      return spaceId;
    }

    if (config.defaults.spaceId !== undefined) {
      return config.defaults.spaceId;
    }

    const spaces = await this.listSpaces(authToken);
    if (spaces.spaces.length === 0) {
      throw new Error("No memory spaces found. Create a space first before searching or adding memories.");
    }

    return spaces.spaces[0].id;
  }
}

export const memoryClient = new MemoryClient();
