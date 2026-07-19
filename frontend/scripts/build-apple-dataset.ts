import "dotenv/config";
import { writeFileSync } from "node:fs";
import path from "node:path";

const SYMBOL = "AAPL";
const PEER_SYMBOLS = ["MSFT", "GOOGL"];
const YEARS_OF_HISTORY = 10;

// AAPL did a 4-for-1 stock split effective 2020-08-31. Each fiscal year's own
// 10-K reports EPS as filed at the time -- fiscal years ending before the
// split (FY2016-FY2019 here) are on a pre-split share-count basis, while
// FY2020 onward are already post-split. Left unadjusted, the raw EPS series
// shows a fake ~3.6x "collapse" in FY2020 even though net income was flat
// that year. Adjusting older years by the split factor makes the series
// comparable across the whole window.
const STOCK_SPLIT_ADJUSTMENTS = [{ beforeFiscalYear: 2020, factor: 4 }];

function adjustEpsForSplits(fiscalYear: number, eps: number | null): number | null {
  if (eps === null) return null;
  let adjusted = eps;
  for (const split of STOCK_SPLIT_ADJUSTMENTS) {
    if (fiscalYear < split.beforeFiscalYear) {
      adjusted = adjusted / split.factor;
    }
  }
  return adjusted;
}

interface XbrlItem {
  concept: string;
  unit: string;
  label: string;
  value: number;
}

interface ReportedFinancials {
  year: number;
  form: string;
  endDate: string;
  report: {
    ic: XbrlItem[];
    bs: XbrlItem[];
    cf: XbrlItem[];
  };
}

// XBRL concept names drift across years (e.g. a 2018 revenue-recognition
// standard change renamed the revenue concept) -- each field lists every
// alias seen in AAPL's own filings, tried in order. A field stays null for
// a given year if none of its aliases are present, same graceful-missing-
// data approach as the backend screener.
const CONCEPT_ALIASES: Record<string, string[]> = {
  revenue: [
    "us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax",
    "us-gaap_SalesRevenueNet",
    "us-gaap_Revenues",
  ],
  costOfRevenue: ["us-gaap_CostOfGoodsAndServicesSold", "us-gaap_CostOfRevenue"],
  grossProfit: ["us-gaap_GrossProfit"],
  researchAndDevelopment: ["us-gaap_ResearchAndDevelopmentExpense"],
  sellingGeneralAndAdministrative: ["us-gaap_SellingGeneralAndAdministrativeExpense"],
  operatingIncome: ["us-gaap_OperatingIncomeLoss"],
  netIncome: ["us-gaap_NetIncomeLoss"],
  epsBasic: ["us-gaap_EarningsPerShareBasic"],
  epsDiluted: ["us-gaap_EarningsPerShareDiluted"],
  cashAndEquivalents: ["us-gaap_CashAndCashEquivalentsAtCarryingValue"],
  totalAssets: ["us-gaap_Assets"],
  totalLiabilities: ["us-gaap_Liabilities"],
  stockholdersEquity: ["us-gaap_StockholdersEquity"],
  longTermDebtNoncurrent: ["us-gaap_LongTermDebtNoncurrent"],
  longTermDebtCurrent: ["us-gaap_LongTermDebtCurrent"],
  capex: ["us-gaap_PaymentsToAcquirePropertyPlantAndEquipment"],
  operatingCashFlow: [
    "us-gaap_NetCashProvidedByUsedInOperatingActivities",
    "us-gaap_NetCashProvidedByUsedInOperatingActivitiesContinuingOperations",
  ],
  dividendsPaid: [
    "us-gaap_PaymentsOfDividends",
    "aapl_PaymentsOfDividendsAndDividendEquivalentsOnCommonStockAndRestrictedStockUnits",
  ],
  buybacks: ["us-gaap_PaymentsForRepurchaseOfCommonStock"],
};

function findValue(items: XbrlItem[], aliases: string[]): number | null {
  for (const alias of aliases) {
    const match = items.find((item) => item.concept === alias);
    if (match) return match.value;
  }
  return null;
}

function sumNullable(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  return (a ?? 0) + (b ?? 0);
}

function subtractNullable(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return a - b;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub request failed: ${response.status} ${url}`);
  }
  return response.json() as Promise<T>;
}

async function fetchAnnualReports(symbol: string, apiKey: string): Promise<ReportedFinancials[]> {
  const url = `https://finnhub.io/api/v1/stock/financials-reported?symbol=${symbol}&freq=annual&token=${apiKey}`;
  const data = await fetchJson<{ data?: ReportedFinancials[] }>(url);
  return data.data ?? [];
}

async function fetchCurrentMetrics(symbol: string, apiKey: string) {
  const url = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`;
  const data = await fetchJson<{ metric?: Record<string, number> }>(url);
  const metric = data.metric ?? {};
  return {
    peTTM: metric.peTTM ?? null,
    roeTTM: metric.roeTTM ?? null,
    netProfitMarginTTM: metric.netProfitMarginTTM ?? null,
    grossMarginTTM: metric.grossMarginTTM ?? null,
    debtToEquityQuarterly: metric["totalDebt/totalEquityQuarterly"] ?? null,
  };
}

function extractYear(report: ReportedFinancials) {
  const items = [...report.report.ic, ...report.report.bs, ...report.report.cf];
  const c = CONCEPT_ALIASES;

  const operatingCashFlow = findValue(items, c.operatingCashFlow);
  const capex = findValue(items, c.capex);

  return {
    fiscalYear: report.year,
    periodEnd: report.endDate,
    form: report.form,
    revenue: findValue(items, c.revenue),
    costOfRevenue: findValue(items, c.costOfRevenue),
    grossProfit: findValue(items, c.grossProfit),
    researchAndDevelopment: findValue(items, c.researchAndDevelopment),
    sellingGeneralAndAdministrative: findValue(items, c.sellingGeneralAndAdministrative),
    operatingIncome: findValue(items, c.operatingIncome),
    netIncome: findValue(items, c.netIncome),
    epsBasic: adjustEpsForSplits(report.year, findValue(items, c.epsBasic)),
    epsDiluted: adjustEpsForSplits(report.year, findValue(items, c.epsDiluted)),
    cashAndEquivalents: findValue(items, c.cashAndEquivalents),
    totalAssets: findValue(items, c.totalAssets),
    totalLiabilities: findValue(items, c.totalLiabilities),
    stockholdersEquity: findValue(items, c.stockholdersEquity),
    longTermDebt: sumNullable(
      findValue(items, c.longTermDebtNoncurrent),
      findValue(items, c.longTermDebtCurrent),
    ),
    capex,
    operatingCashFlow,
    freeCashFlow: subtractNullable(operatingCashFlow, capex),
    dividendsPaid: findValue(items, c.dividendsPaid),
    buybacks: findValue(items, c.buybacks),
  };
}

async function main() {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error("FINNHUB_API_KEY is not set. Add it to frontend/.env before running this script.");
  }

  console.log(`Fetching up to ${YEARS_OF_HISTORY}y of annual reports for ${SYMBOL}...`);
  const reports = await fetchAnnualReports(SYMBOL, apiKey);
  const annualHistory = reports
    .filter((r) => r.form === "10-K")
    .slice(0, YEARS_OF_HISTORY)
    .map(extractYear)
    .sort((a, b) => a.fiscalYear - b.fiscalYear);

  console.log(`Fetching current snapshot metrics for ${SYMBOL} and peers (${PEER_SYMBOLS.join(", ")})...`);
  const current = await fetchCurrentMetrics(SYMBOL, apiKey);
  const peers: Record<string, Awaited<ReturnType<typeof fetchCurrentMetrics>>> = {};
  for (const peer of PEER_SYMBOLS) {
    peers[peer] = await fetchCurrentMetrics(peer, apiKey);
  }

  const dataset = {
    symbol: SYMBOL,
    name: "Apple Inc.",
    as_of: new Date().toISOString().slice(0, 10),
    source: "Finnhub (stock/financials-reported, stock/metric) -- SEC 10-K filings",
    notes:
      "epsBasic/epsDiluted for fiscal years before 2020 are adjusted for AAPL's " +
      "2020-08-31 4-for-1 stock split to keep the series comparable across years. " +
      "All other fields are as reported, unadjusted.",
    annualHistory,
    current,
    peers,
  };

  const outPath = path.join(process.cwd(), "data", "apple-fundamentals.json");
  writeFileSync(outPath, JSON.stringify(dataset, null, 2));
  console.log(`Wrote ${annualHistory.length} years of history to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
