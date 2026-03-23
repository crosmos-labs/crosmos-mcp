import { buildUrl, config } from "../config/index.js";
import type {
  AddMemoryRequest,
  AddMemoryResponse,
  SearchRequest,
  SearchResponse,
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

  private async request<T>(url: string, options: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`;
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

  async search(params: SearchRequest): Promise<SearchResponse> {
    const url = buildUrl(config.api, "search");
    return this.request<SearchResponse>(url, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async addMemory(params: AddMemoryRequest): Promise<AddMemoryResponse> {
    const url = buildUrl(config.api, "memoryAdd");
    return this.request<AddMemoryResponse>(url, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async health(): Promise<{ status: string }> {
    const url = buildUrl(config.api, "health");
    return this.request<{ status: string }>(url, {
      method: "GET",
    });
  }
}

export const memoryClient = new MemoryClient();
