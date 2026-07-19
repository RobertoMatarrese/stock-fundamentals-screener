"use client";

import { useEffect, useState } from "react";
import { fetchScreenerData } from "./api";
import ScreenerTable from "./ScreenerTable";
import type { ScreenerRow } from "./types";

export default function ScreenerData() {
  const [data, setData] = useState<ScreenerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchScreenerData()
      .then((rows) => {
        if (!cancelled) setData(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Couldn't load screener data. Is the backend running?");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="px-3 py-6 text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (!data) {
    return <p className="px-3 py-6 text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>;
  }

  return <ScreenerTable data={data} />;
}
