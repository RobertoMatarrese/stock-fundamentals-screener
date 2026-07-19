export interface ScreenerRow {
  symbol: string;
  name: string;
  sector: string;
  pe_ratio: number | null;
  roe: number | null;
  debt_to_equity: number | null;
  net_margin: number | null;
  asset_turnover: number | null;
  equity_multiplier: number | null;
}
