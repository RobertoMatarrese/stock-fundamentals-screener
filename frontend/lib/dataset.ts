import raw from "@/data/apple-fundamentals.json";

export interface AnnualFinancials {
  fiscalYear: number;
  periodEnd: string;
  form: string;
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  researchAndDevelopment: number | null;
  sellingGeneralAndAdministrative: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  epsBasic: number | null;
  epsDiluted: number | null;
  cashAndEquivalents: number | null;
  totalAssets: number | null;
  totalLiabilities: number | null;
  stockholdersEquity: number | null;
  longTermDebt: number | null;
  capex: number | null;
  operatingCashFlow: number | null;
  freeCashFlow: number | null;
  dividendsPaid: number | null;
  buybacks: number | null;
}

export interface CurrentMetrics {
  peTTM: number | null;
  roeTTM: number | null;
  netProfitMarginTTM: number | null;
  grossMarginTTM: number | null;
  debtToEquityQuarterly: number | null;
}

export interface AppleFundamentalsDataset {
  symbol: string;
  name: string;
  as_of: string;
  source: string;
  notes: string;
  annualHistory: AnnualFinancials[];
  current: CurrentMetrics;
  peers: Record<string, CurrentMetrics>;
}

export const dataset = raw as AppleFundamentalsDataset;
