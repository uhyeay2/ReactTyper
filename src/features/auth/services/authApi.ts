import { apiFetch } from "@/infrastructure/api/client";
import type { AuthUser } from "../state/authTypes";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export async function apiLogin(payload: LoginPayload): Promise<AuthUser> {
  const response = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.user;
}

export async function apiRegister(payload: RegisterPayload): Promise<AuthUser> {
  const response = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.user;
}

export async function apiFetchMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me");
}

export async function apiLogout(): Promise<void> {
  await apiFetch<void>("/auth/logout", { method: "POST" });
}
