import { NextResponse } from "next/server";
import { dataset } from "@/lib/dataset";
import { synthesizeAnswer } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";
import { retrieve } from "@/lib/retrieval";

const MAX_QUESTION_LENGTH = 300;

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "unknown";
}

export async function POST(request: Request) {
  let body: { question?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "Missing 'question'" }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json(
      { error: `Question too long (max ${MAX_QUESTION_LENGTH} characters)` },
      { status: 400 },
    );
  }

  const ip = getClientIp(request);

  let rateLimitResult;
  try {
    rateLimitResult = await checkRateLimit(ip);
  } catch (error) {
    console.error("Rate limit check failed", error);
    return NextResponse.json({ error: "Rate limiting unavailable" }, { status: 503 });
  }

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Hai raggiunto il limite di domande per questa sessione.",
        remaining: 0,
        limit: rateLimitResult.limit,
      },
      { status: 429 },
    );
  }

  const { chunkIds, context } = retrieve(question);

  if (chunkIds.length === 0) {
    return NextResponse.json({
      testo:
        "Questa domanda non riguarda i fondamentali storici di Apple che ho a disposizione " +
        "(crescita, margini, cash flow, bilancio, dividendi/buyback, valutazione rispetto ai " +
        "competitor). Prova a riformularla su uno di questi temi.",
      grafico: null,
      remaining: rateLimitResult.remaining,
      limit: rateLimitResult.limit,
    });
  }

  try {
    const answer = await synthesizeAnswer(question, context, dataset.as_of);
    return NextResponse.json({
      ...answer,
      remaining: rateLimitResult.remaining,
      limit: rateLimitResult.limit,
    });
  } catch (error) {
    console.error("Gemini synthesis failed", error);
    return NextResponse.json(
      { error: "Il modello non è riuscito a rispondere, riprova tra poco." },
      { status: 502 },
    );
  }
}
