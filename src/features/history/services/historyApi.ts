import { apiFetch } from "@/infrastructure/api/client";
import type {
  RecordTypingResultPayload,
  TypingTestResult,
} from "../state/historyTypes";

interface ListHistoryResponse {
  results: TypingTestResult[];
}

interface RecordResponse {
  result: TypingTestResult;
}

export async function apiListHistory(): Promise<TypingTestResult[]> {
  const response = await apiFetch<ListHistoryResponse>("/typing-history");
  return response.results;
}

export async function apiRecordResult(
  payload: RecordTypingResultPayload,
): Promise<TypingTestResult> {
  const response = await apiFetch<RecordResponse>("/typing-history", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.result;
}
