import { dataset, type AppleFundamentalsDataset, type AnnualFinancials } from "./dataset";

export interface RetrievalChunk {
  id: string;
  label: string;
  keywords: string[];
  getData: (data: AppleFundamentalsDataset) => unknown;
}

function trend(data: AppleFundamentalsDataset, fields: (keyof AnnualFinancials)[]) {
  return data.annualHistory.map((year) => {
    const row: Record<string, number | string | null> = { fiscalYear: year.fiscalYear };
    for (const field of fields) {
      row[field] = year[field];
    }
    return row;
  });
}

export const CHUNKS: RetrievalChunk[] = [
  {
    id: "growth",
    label: "Revenue & earnings growth",
    keywords: [
      "crescita", "cresce", "crescono", "crescendo", "utili", "ricavi", "fatturato",
      "aumento", "aumentat", "calo", "diminui", "declino", "trend",
      "growth", "earnings", "revenue", "sales", "increase", "decrease",
    ],
    getData: (data) => ({
      fiscalYearHistory: trend(data, ["revenue", "netIncome", "epsDiluted"]),
    }),
  },
  {
    id: "profitability",
    label: "Margins & profitability",
    keywords: [
      "margine", "margini", "marginalit", "redditivit", "efficien",
      "margin", "profitability", "profitable",
    ],
    getData: (data) => ({
      fiscalYearHistory: data.annualHistory.map((y) => ({
        fiscalYear: y.fiscalYear,
        grossMargin: y.revenue && y.grossProfit ? y.grossProfit / y.revenue : null,
        operatingMargin: y.revenue && y.operatingIncome ? y.operatingIncome / y.revenue : null,
        netMargin: y.revenue && y.netIncome ? y.netIncome / y.revenue : null,
      })),
      currentNetMarginTTM: data.current.netProfitMarginTTM,
      currentGrossMarginTTM: data.current.grossMarginTTM,
    }),
  },
  {
    id: "cashflow",
    label: "Cash flow",
    keywords: [
      "cash flow", "flusso di cassa", "liquidit", "cassa", "cash", "fcf", "free cash flow",
      "capex", "investiment",
    ],
    getData: (data) => ({
      fiscalYearHistory: trend(data, ["operatingCashFlow", "capex", "freeCashFlow", "cashAndEquivalents"]),
    }),
  },
  {
    id: "balance_sheet",
    label: "Balance sheet & debt",
    keywords: [
      "debito", "indebitamento", "leva", "bilancio", "patrimonio", "solidit",
      "debt", "balance sheet", "equity", "assets", "liabilities", "solvency",
    ],
    getData: (data) => ({
      fiscalYearHistory: trend(data, ["totalAssets", "totalLiabilities", "stockholdersEquity", "longTermDebt"]),
      currentDebtToEquity: data.current.debtToEquityQuarterly,
    }),
  },
  {
    id: "capital_returns",
    label: "Dividends & buybacks",
    keywords: ["dividend", "buyback", "riacquisto", "azioni proprie", "payout", "cedola"],
    getData: (data) => ({
      fiscalYearHistory: trend(data, ["dividendsPaid", "buybacks", "netIncome"]),
    }),
  },
  {
    id: "valuation",
    label: "Valuation & peer comparison",
    keywords: [
      "cara", "costosa", "economica", "conveniente", "valutazione", "multipl",
      "p/e", "pe ratio", "prezzo", "competitor", "concorrent", "rispetto a",
      "valuation", "expensive", "cheap", "peer", "compare", "confront",
    ],
    getData: (data) => ({
      current: data.current,
      peers: data.peers,
    }),
  },
  {
    id: "overview",
    label: "General overview",
    keywords: [
      "generale", "overview", "riassunto", "panoramica", "parlami",
      "cosa ne pensi", "situazione", "salute finanziaria", "financial health",
    ],
    getData: (data) => ({
      mostRecentYear: data.annualHistory[data.annualHistory.length - 1],
      current: data.current,
    }),
  },
];

export interface RetrievalResult {
  chunkIds: string[];
  context: Record<string, unknown>;
}

const MAX_CHUNKS = 2;

export function retrieve(question: string): RetrievalResult {
  const normalized = question.toLowerCase();

  const scored = CHUNKS.map((chunk) => ({
    chunk,
    score: chunk.keywords.filter((keyword) => normalized.includes(keyword)).length,
  })).filter((entry) => entry.score > 0);

  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, MAX_CHUNKS);

  const context: Record<string, unknown> = {};
  for (const { chunk } of selected) {
    context[chunk.id] = chunk.getData(dataset);
  }

  return {
    chunkIds: selected.map((entry) => entry.chunk.id),
    context,
  };
}
