import type { ScreenerRow } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchScreenerData(): Promise<ScreenerRow[]> {
  const response = await fetch(`${API_URL}/api/screener`);
  if (!response.ok) {
    throw new Error(`Screener API returned ${response.status}`);
  }
  return response.json();
}
