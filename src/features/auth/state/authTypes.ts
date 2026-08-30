export interface AuthUser {
  publicId: string;
  username: string;
  role: string;
}

export type AuthStatus = "idle" | "authenticated" | "anonymous";

export type AsyncRequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  authRequest: AsyncRequestStatus;
  error: string | null;
}
