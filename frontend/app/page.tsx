import ScreenerData from "./ScreenerData";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 dark:bg-black">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Stock Fundamentals Screener
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Value and quality metrics for a fixed basket of 12 large-cap tickers.
          Click a column header to sort.
        </p>
        <div className="mt-6 overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <ScreenerData />
        </div>
      </div>
    </main>
  );
}
