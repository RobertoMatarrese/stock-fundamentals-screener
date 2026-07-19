"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartData {
  tipo: "line" | "bar";
  titolo: string;
  dati: { label: string; valore: number }[];
}

interface ChatAnswer {
  testo: string;
  grafico: ChartData | null;
}

interface Exchange {
  question: string;
  answer?: ChatAnswer;
  error?: string;
}

const MAX_QUESTION_LENGTH = 300;
const SERIES_COLOR = "var(--chart-series-1)";
const GRID_COLOR = "var(--chart-grid)";
const AXIS_COLOR = "var(--chart-axis)";

const TOOLTIP_CONTENT_STYLE = {
  background: "var(--chart-surface)",
  border: "1px solid var(--chart-grid)",
  borderRadius: 8,
  fontSize: 12,
};
const TOOLTIP_LABEL_STYLE = { color: "var(--chart-ink-primary)", fontWeight: 600 };
const TOOLTIP_ITEM_STYLE = { color: "var(--chart-ink-secondary)" };

function ChartRenderer({ chart }: { chart: ChartData }) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">{chart.titolo}</p>
      <ResponsiveContainer width="100%" height={220}>
        {chart.tipo === "bar" ? (
          <BarChart data={chart.dati}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="label" fontSize={12} stroke={AXIS_COLOR} tickLine={false} />
            <YAxis fontSize={12} stroke={AXIS_COLOR} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
            />
            <Bar dataKey="valore" fill={SERIES_COLOR} radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        ) : (
          <LineChart data={chart.dati}>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis dataKey="label" fontSize={12} stroke={AXIS_COLOR} tickLine={false} />
            <YAxis fontSize={12} stroke={AXIS_COLOR} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
            />
            <Line
              type="monotone"
              dataKey="valore"
              stroke={SERIES_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default function ChatUI() {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function submitQuestion() {
    const trimmed = question.trim();
    if (!trimmed || loading || remaining === 0) return;

    setLoading(true);
    setQuestion("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await response.json();

      if (typeof data.remaining === "number") setRemaining(data.remaining);

      if (!response.ok) {
        setExchanges((prev) => [
          ...prev,
          { question: trimmed, error: data.error ?? "Errore sconosciuto" },
        ]);
        return;
      }

      setExchanges((prev) => [
        ...prev,
        { question: trimmed, answer: { testo: data.testo, grafico: data.grafico } },
      ]);
    } catch {
      setExchanges((prev) => [...prev, { question: trimmed, error: "Errore di rete, riprova." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submitQuestion();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuestion();
    }
  }

  const limitReached = remaining === 0;

  return (
    <div className="flex flex-col gap-3">
      {exchanges.length > 0 && (
        <div className="flex flex-col gap-3">
          {exchanges.map((exchange, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <p className="self-end rounded-2xl rounded-br-sm bg-blue-600 px-3 py-2 text-sm text-white">
                {exchange.question}
              </p>
              {exchange.error ? (
                <p className="self-start rounded-2xl rounded-bl-sm bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  {exchange.error}
                </p>
              ) : exchange.answer ? (
                <div className="self-start rounded-2xl rounded-bl-sm bg-neutral-100 px-3 py-2 text-sm text-zinc-800 dark:bg-neutral-800 dark:text-zinc-100">
                  <p>{exchange.answer.testo}</p>
                  {exchange.answer.grafico && <ChartRenderer chart={exchange.answer.grafico} />}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {loading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Sto pensando...</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_QUESTION_LENGTH}
          disabled={loading || limitReached}
          placeholder="Es. Gli utili di Apple sono in crescita? (Invio per inviare, Shift+Invio per andare a capo)"
          rows={2}
          className="w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {remaining === null
              ? "2 domande per sessione"
              : `${remaining} domand${remaining === 1 ? "a" : "e"} rimanenti`}
          </span>
          <button
            type="submit"
            disabled={loading || limitReached || !question.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {limitReached ? "Limite raggiunto" : "Invia"}
          </button>
        </div>
      </form>
    </div>
  );
}
