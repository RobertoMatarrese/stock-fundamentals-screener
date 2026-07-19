"use client";

import { useMemo, useState } from "react";
import type { ScreenerRow } from "./types";

type SortDirection = "asc" | "desc";

interface Column {
  key: keyof ScreenerRow;
  label: string;
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
  { key: "debt_to_equity", label: "Debt/Equity", numeric: true, format: ratio },
  { key: "net_margin", label: "Net Margin", numeric: true, format: percent },
  { key: "asset_turnover", label: "Asset Turnover", numeric: true, format: ratio },
  { key: "equity_multiplier", label: "Equity Multiplier", numeric: true, format: ratio },
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
        <tr className="border-b border-neutral-300 dark:border-neutral-700">
          {COLUMNS.map((column) => (
            <th
              key={column.key}
              onClick={() => handleSort(column.key)}
              className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 font-semibold hover:text-blue-600 dark:hover:text-blue-400 ${
                column.numeric ? "text-right" : "text-left"
              }`}
            >
              {column.label}
              {sortKey === column.key ? (sortDirection === "asc" ? " ▲" : " ▼") : ""}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row) => (
          <tr
            key={row.symbol}
            className="border-b border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
          >
            {COLUMNS.map((column) => (
              <td
                key={column.key}
                className={`whitespace-nowrap px-3 py-2 ${column.numeric ? "text-right tabular-nums" : "text-left"}`}
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
