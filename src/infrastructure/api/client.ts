const BASE_URL = "/api";
const JSON_TYPE = "application/json";
const CSRF_HEADER = "X-CSRF-TOKEN";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ApiProblem | undefined;

  constructor(status: number, message: string, problem?: ApiProblem) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

let cachedCsrfToken: string | null = null;
let csrfInflight: Promise<string> | null = null;

interface CsrfResponse {
  token: string;
}

function isUnsafeMethod(method: string): boolean {
  return UNSAFE_METHODS.has(method.toUpperCase());
}

async function fetchCsrfToken(): Promise<string> {
  if (cachedCsrfToken !== null) {
    return cachedCsrfToken;
  }
  if (csrfInflight === null) {
    csrfInflight = apiFetchRaw<CsrfResponse>("/auth/csrf")
      .then((response) => {
        cachedCsrfToken = response.token;
        return cachedCsrfToken;
      })
      .finally(() => {
        csrfInflight = null;
      });
  }
  return csrfInflight;
}

export function resetCsrfToken(): void {
  cachedCsrfToken = null;
}

function buildHeaders(init: RequestInit): Headers {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", JSON_TYPE);
  return headers;
}

async function parseProblem(response: Response): Promise<ApiProblem | undefined> {
  try {
    const body: unknown = await response.json();
    if (isApiProblem(body)) {
      return body;
    }
  } catch {
    // Response body was not valid JSON; surface a generic error below.
  }
  return undefined;
}

function isApiProblem(value: unknown): value is ApiProblem {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["title"] === "string" &&
    typeof candidate["status"] === "number"
  );
}

async function readBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function apiFetchRaw<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: buildHeaders(init),
  });

  if (!response.ok) {
    const problem = await parseProblem(response);
    const message =
      problem?.title ?? `Request failed with status ${response.status}.`;
    throw new ApiError(response.status, message, problem);
  }

  return readBody<T>(response);
}

/**
 * Performs an authenticated API request. State-changing requests automatically
 * attach the double-submit CSRF token so cookie-authenticated writes are protected.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = init.method ?? "GET";
  const headers = new Headers(init.headers);
  headers.set("Content-Type", JSON_TYPE);

  if (isUnsafeMethod(method)) {
    const token = await fetchCsrfToken();
    headers.set(CSRF_HEADER, token);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    method,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const problem = await parseProblem(response);
    const message =
      problem?.title ?? `Request failed with status ${response.status}.`;
    throw new ApiError(response.status, message, problem);
  }

  return readBody<T>(response);
}
