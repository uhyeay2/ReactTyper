import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ApiError } from "@/infrastructure/api/client";
import {
  apiFetchMe,
  apiLogin,
  apiLogout,
  apiRegister,
  type LoginPayload,
  type RegisterPayload,
} from "../services/authApi";
import type { AuthState, AuthUser } from "./authTypes";

const initialState: AuthState = {
  user: null,
  status: "idle",
  authRequest: "idle",
  error: null,
};

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

export const login = createAsyncThunk<AuthUser, LoginPayload>(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      return await apiLogin(payload);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const register = createAsyncThunk<AuthUser, RegisterPayload>(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      return await apiRegister(payload);
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const fetchMe = createAsyncThunk<boolean>(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const user = await apiFetchMe();
      return user !== null;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const logout = createAsyncThunk<void>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await apiLogout();
      return;
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.authRequest = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.authRequest = "succeeded";
        state.user = action.payload;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.authRequest = "failed";
        state.error = (action.payload as string) ?? "Login failed.";
      })
      .addCase(register.pending, (state) => {
        state.authRequest = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.authRequest = "succeeded";
        state.user = action.payload;
        state.status = "authenticated";
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.authRequest = "failed";
        state.error = (action.payload as string) ?? "Registration failed.";
      })
      .addCase(fetchMe.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = action.payload ? "authenticated" : "anonymous";
      })
      .addCase(fetchMe.rejected, (state) => {
        state.status = "anonymous";
      })
      .addCase(logout.pending, (state) => {
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.status = "anonymous";
        state.authRequest = "idle";
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.user = null;
        state.status = "anonymous";
        state.error = (action.payload as string) ?? "Logout failed.";
      });
  },
});

export const { clearAuthError } = authSlice.actions;

export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthStatus = (state: { auth: AuthState }) => state.auth.status;
export const selectAuthRequestStatus = (state: { auth: AuthState }) =>
  state.auth.authRequest;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.status === "authenticated";
export const selectIsAdmin = (state: { auth: AuthState }) =>
  state.auth.user?.role?.toLowerCase() === "admin";

export default authSlice.reducer;
