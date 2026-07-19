"use client";

import { useMemo, useState } from "react";
import type { ScreenerRow } from "./types";

type SortDirection = "asc" | "desc";

interface Column {
  key: keyof ScreenerRow;
  label: string;
  title?: string;
  numeric: boolean;
  format?: (value: number) => string;
}

const percent = (value: number) => `${value.toFixed(2)}%`;
const ratio = (value: number) => `${value.toFixed(2)}x`;

const COLUMNS: Column[] = [
  { key: "symbol", label: "Symbol", numeric: false },
  { key: "name", label: "Name", numeric: false },
  { key: "sector", label: "Sector", numeric: false },
  { key: "pe_ratio", label: "P/E", numeric: true, format: ratio },
  { key: "roe", label: "ROE", numeric: true, format: percent },
  { key: "debt_to_equity", label: "D/E", title: "Debt / Equity", numeric: true, format: ratio },
  { key: "net_margin", label: "Net Margin", numeric: true, format: percent },
  { key: "asset_turnover", label: "Turnover", title: "Asset Turnover", numeric: true, format: ratio },
  {
    key: "equity_multiplier",
    label: "Leverage",
    title: "Equity Multiplier (Assets / Equity)",
    numeric: true,
    format: ratio,
  },
];

function formatCell(column: Column, value: ScreenerRow[keyof ScreenerRow]): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (column.numeric && column.format) {
    return column.format(value as number);
  }
  return String(value);
}

export default function ScreenerTable({ data }: { data: ScreenerRow[] }) {
  const [sortKey, setSortKey] = useState<keyof ScreenerRow>("symbol");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedData = useMemo(() => {
    const withIndex = data.map((row, index) => ({ row, index }));

    withIndex.sort((a, b) => {
      const aValue = a.row[sortKey];
      const bValue = b.row[sortKey];

      if (aValue === null && bValue === null) return a.index - b.index;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      let comparison: number;
      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return withIndex.map((entry) => entry.row);
  }, [data, sortKey, sortDirection]);

  function handleSort(key: keyof ScreenerRow) {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60">
          {COLUMNS.map((column) => (
            <th
              key={column.key}
              title={column.title}
              onClick={() => handleSort(column.key)}
              className={`cursor-pointer select-none whitespace-nowrap px-2.5 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 ${
                column.numeric ? "text-right" : "text-left"
              }`}
            >
              {column.label}
              <span className="ml-0.5 inline-block w-2.5 text-[10px] text-blue-600 dark:text-blue-400">
                {sortKey === column.key ? (sortDirection === "asc" ? "▲" : "▼") : ""}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row) => (
          <tr
            key={row.symbol}
            className="border-b border-neutral-100 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900/60"
          >
            {COLUMNS.map((column) => (
              <td
                key={column.key}
                title={column.key === "name" ? row.name : undefined}
                className={`px-2.5 py-2 ${
                  column.numeric
                    ? "whitespace-nowrap text-right tabular-nums"
                    : column.key === "name"
                      ? "max-w-[160px] truncate font-medium text-zinc-900 dark:text-zinc-100"
                      : "whitespace-nowrap text-left"
                }`}
              >
                {formatCell(column, row[column.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
