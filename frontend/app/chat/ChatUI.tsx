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

function ChartRenderer({ chart }: { chart: ChartData }) {
  return (
    <div className="mt-3">
      <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">{chart.titolo}</p>
      <ResponsiveContainer width="100%" height={220}>
        {chart.tipo === "bar" ? (
          <BarChart data={chart.dati}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="valore" fill="#2563eb" />
          </BarChart>
        ) : (
          <LineChart data={chart.dati}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="valore" stroke="#2563eb" strokeWidth={2} dot={false} />
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
    <div className="flex flex-col gap-4">
      {exchanges.length > 0 && (
        <div className="flex flex-col gap-4">
          {exchanges.map((exchange, index) => (
            <div
              key={index}
              className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {exchange.question}
              </p>
              {exchange.error ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{exchange.error}</p>
              ) : exchange.answer ? (
                <>
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {exchange.answer.testo}
                  </p>
                  {exchange.answer.grafico && <ChartRenderer chart={exchange.answer.grafico} />}
                </>
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
