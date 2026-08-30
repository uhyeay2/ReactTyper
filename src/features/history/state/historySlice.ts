import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiListHistory, apiRecordResult } from "../services/historyApi";
import type {
  RecordTypingResultPayload,
  TypingTestResult,
} from "./historyTypes";

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

export interface HistoryState {
  results: TypingTestResult[];
  isLoading: boolean;
  loadError: string | null;
  saveStatus: SaveStatus;
}

const initialState: HistoryState = {
  results: [],
  isLoading: false,
  loadError: null,
  saveStatus: "idle",
};

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred.";
}

export const loadHistory = createAsyncThunk<TypingTestResult[]>(
  "history/load",
  async (_, { rejectWithValue }) => {
    try {
      return await apiListHistory();
    } catch (error) {
      return rejectWithValue(errorMessage(error));
    }
  },
);

export const recordResult = createAsyncThunk<
  TypingTestResult,
  RecordTypingResultPayload
>("history/record", async (payload, { rejectWithValue }) => {
  try {
    return await apiRecordResult(payload);
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    resetSaveStatus(state) {
      state.saveStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadHistory.pending, (state) => {
        state.isLoading = true;
        state.loadError = null;
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.results = action.payload;
      })
      .addCase(loadHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.loadError = (action.payload as string) ?? "Failed to load history.";
      })
      .addCase(recordResult.pending, (state) => {
        state.saveStatus = "saving";
      })
      .addCase(recordResult.fulfilled, (state) => {
        state.saveStatus = "saved";
      })
      .addCase(recordResult.rejected, (state) => {
        state.saveStatus = "failed";
      });
  },
});

export const { resetSaveStatus } = historySlice.actions;

export const selectHistoryResults = (state: { history: HistoryState }) =>
  state.history.results;
export const selectHistoryLoading = (state: { history: HistoryState }) =>
  state.history.isLoading;
export const selectHistoryError = (state: { history: HistoryState }) =>
  state.history.loadError;
export const selectSaveStatus = (state: { history: HistoryState }) =>
  state.history.saveStatus;

export default historySlice.reducer;
