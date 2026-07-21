import {
  ApiResponse,
  Drug,
  HistoryDetail,
  HistoryListItem,
  InteractionCheckResult,
  ReportDetail,
  ReportListItem,
  ReportStatus,
  User,
} from "./types";

const apiBase = "";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  retryOnUnauthorized?: boolean;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { body, retryOnUnauthorized = true, headers, ...rest } = options;
  const response = await fetch(`${apiBase}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && retryOnUnauthorized && path !== "/users/refresh-token") {
    const refreshed = await fetch(`${apiBase}/users/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (refreshed.ok) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
  }

  const json = await response.json().catch(() => ({
    message: "Unexpected server response",
    success: false,
    statusCode: response.status,
    data: null,
  }));

  if (!response.ok || !json.success) {
    throw new Error(json.message || "Request failed");
  }

  return json;
}

export const api = {
  auth: {
    register: (payload: { name: string; email: string; password: string }) =>
      apiRequest<{ user: User }>("/users/register", { method: "POST", body: payload }),
    login: (payload: { email: string; password: string }) =>
      apiRequest<{ user: User }>("/users/login", { method: "POST", body: payload }),
    refresh: () => apiRequest<{ user: User }>("/users/refresh-token", { method: "POST", retryOnUnauthorized: false }),
    logout: () => apiRequest<Record<string, never>>("/users/logout", { method: "POST", retryOnUnauthorized: false }),
    profile: () => apiRequest<User>("/users/profile", { method: "GET" }),
  },
  drugs: {
    search: (query: string) =>
      apiRequest<{ query: string; drugs: Drug[] }>(`/drugs/search?q=${encodeURIComponent(query)}`, { method: "GET" }),
    details: (rxcui: string) => apiRequest<Drug>(`/drugs/${encodeURIComponent(rxcui)}`, { method: "GET" }),
    scan: (payload: { image: string; mimeType: string }) =>
      apiRequest<{ medicationName: string; genericName: string; scanSource?: string; ocrText?: string; ocrError?: string }>("/drugs/scan", { method: "POST", body: payload }),
    barcode: (payload: { barcodeValue: string; format?: string }) =>
      apiRequest<{ medicationName: string | null; genericName: string | null; rxcui: string | null; source: string }>("/drugs/barcode", { method: "POST", body: payload }),
  },
  interactions: {
    check: (drugs: Drug[]) =>
      apiRequest<InteractionCheckResult>("/interactions/check", {
        method: "POST",
        body: { drugs: drugs.map(({ rxcui, name }) => ({ rxcui, name })) },
      }),
  },
  history: {
    list: () => apiRequest<HistoryListItem[]>("/history", { method: "GET" }),
    detail: (id: number) => apiRequest<HistoryDetail>(`/history/${id}`, { method: "GET" }),
    create: (payload: { selectedDrugs: Drug[]; results: unknown[] }) =>
      apiRequest<HistoryDetail>("/history", { method: "POST", body: payload }),
    remove: (id: number) => apiRequest<Record<string, never>>(`/history/${id}`, { method: "DELETE" }),
  },
  reports: {
    list: () => apiRequest<ReportListItem[]>("/reports", { method: "GET" }),
    detail: (id: number) => apiRequest<ReportDetail>(`/reports/${id}`, { method: "GET" }),
    generate: (payload: { historyId?: number; title?: string; notes?: string; selectedDrugs?: Drug[]; interactionResults?: unknown[] }) =>
      apiRequest<ReportDetail>("/reports/generate", { method: "POST", body: payload }),
    update: (id: number, payload: { title?: string; notes?: string | null; status?: ReportStatus }) =>
      apiRequest<ReportDetail>(`/reports/${id}`, { method: "PATCH", body: payload }),
    remove: (id: number) => apiRequest<Record<string, never>>(`/reports/${id}`, { method: "DELETE" }),
  },
  admin: {
    interactions: {
      list: () => apiRequest<unknown[]>("/admin/interactions", { method: "GET" }),
      create: (payload: unknown) => apiRequest<unknown>("/admin/interactions", { method: "POST", body: payload }),
      update: (id: number, payload: unknown) => apiRequest<unknown>(`/admin/interactions/${id}`, { method: "PUT", body: payload }),
      remove: (id: number) => apiRequest<Record<string, never>>(`/admin/interactions/${id}`, { method: "DELETE" }),
    },
  },
};
