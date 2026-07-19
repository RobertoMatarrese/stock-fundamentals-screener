import { dataset } from "@/lib/dataset";
import ChatUI from "./ChatUI";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Apple Fundamentals Chat
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Chiedi qualcosa sui fondamentali storici di Apple (AAPL) — crescita, margini, cash flow,
          bilancio, dividendi/buyback, valutazione rispetto ai competitor.
        </p>

        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Dati fondamentali aggiornati al {dataset.as_of}, tratti da bilanci ufficiali (10-K). Non
          riguardano il prezzo di mercato live né notizie recenti. Massimo 2 domande per sessione.
          <br />
          Le risposte sono generate da un modello AI a scopo dimostrativo e non costituiscono
          consulenza finanziaria o d&apos;investimento.
        </div>

        <div className="mt-6">
          <ChatUI />
        </div>
      </div>
    </main>
  );
}
