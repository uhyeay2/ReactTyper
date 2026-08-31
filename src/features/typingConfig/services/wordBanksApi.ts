import { apiFetch } from "@/infrastructure/api/client";

/** A summary representation of a word bank available for typing tests. */
export interface WordBankSummary {
  slug: string;
  name: string;
  description: string;
  kind: string;
  wordCount: number;
}

/** The detailed representation of a word bank including its words. */
export interface WordBankDetail {
  slug: string;
  name: string;
  description: string;
  kind: string;
  words: string[];
}

interface ListWordBanksResponse {
  wordBanks: WordBankSummary[];
}

interface GetWordBankResponse {
  slug: string;
  name: string;
  description: string;
  kind: string;
  words: { value: string }[];
}

/** Fetches the active word banks available for typing tests. */
export async function apiListWordBanks(): Promise<WordBankSummary[]> {
  const response = await apiFetch<ListWordBanksResponse>("/word-banks");
  return response.wordBanks;
}

/** Fetches a single word bank including its words. */
export async function apiGetWordBank(slug: string): Promise<WordBankDetail> {
  const response = await apiFetch<GetWordBankResponse>(
    `/word-banks/${encodeURIComponent(slug)}`,
  );
  return {
    slug: response.slug,
    name: response.name,
    description: response.description,
    kind: response.kind,
    words: response.words.map((word) => word.value),
  };
}
