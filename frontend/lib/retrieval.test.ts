import { describe, expect, it } from "vitest";
import { retrieve } from "./retrieval";

describe("retrieve", () => {
  it("matches a growth question to the growth chunk", () => {
    const result = retrieve("Gli utili sono in crescita negli ultimi anni?");

    expect(result.chunkIds).toContain("growth");
    expect(result.context.growth).toBeDefined();
  });

  it("matches a cash flow question to the cashflow chunk", () => {
    const result = retrieve("Com'è la situazione cash flow di Apple?");

    expect(result.chunkIds).toContain("cashflow");
  });

  it("matches a valuation/competitor question to the valuation chunk", () => {
    const result = retrieve("È cara rispetto ai competitor?");

    expect(result.chunkIds).toContain("valuation");
    const valuationContext = result.context.valuation as { peers: unknown };
    expect(valuationContext.peers).toBeDefined();
  });

  it("is case-insensitive", () => {
    const lower = retrieve("crescita ricavi");
    const upper = retrieve("CRESCITA RICAVI");

    expect(upper.chunkIds).toEqual(lower.chunkIds);
  });

  it("returns at most 2 chunks even when several match", () => {
    const result = retrieve(
      "Come sono crescita, margini, cash flow, debito, dividendi e valutazione di Apple?",
    );

    expect(result.chunkIds.length).toBeLessThanOrEqual(2);
  });

  it("returns no chunks for an out-of-scope question", () => {
    const result = retrieve("Che tempo fa domani a Cupertino?");

    expect(result.chunkIds).toEqual([]);
    expect(Object.keys(result.context)).toHaveLength(0);
  });

  it("growth chunk includes the full 10-year history", () => {
    const result = retrieve("trend dei ricavi");

    const growthContext = result.context.growth as { fiscalYearHistory: unknown[] };
    expect(growthContext.fiscalYearHistory.length).toBeGreaterThanOrEqual(9);
  });
});
