"use client";

import { useState } from "react";
import { dataset } from "@/lib/dataset";
import ChatUI from "./ChatUI";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Apple Fundamentals Chat"
          className="fixed bottom-24 right-4 z-50 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 sm:right-6"
        >
          <div className="flex items-start justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <h2 className="text-sm font-semibold leading-snug text-black dark:text-zinc-50">
              Hai domande sui fondamentali storici di Apple (AAPL)?
            </h2>
            <button
              onClick={() => setOpen(false)}
              aria-label="Chiudi chat"
              className="shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto p-4">
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              Dati aggiornati al {dataset.as_of}, tratti da bilanci ufficiali (10-K). Non
              riguardano il prezzo di mercato live né notizie recenti. Massimo 2 domande per
              sessione. Le risposte sono generate da un modello AI a scopo dimostrativo e non
              costituiscono consulenza finanziaria o d&apos;investimento.
            </div>

            <div className="mt-4">
              <ChatUI />
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 sm:right-6"
      >
        <span aria-hidden="true">{open ? "✕" : "💬"}</span>
        {open ? "Chiudi" : "Chat su Apple (AAPL)"}
      </button>
    </>
  );
}
