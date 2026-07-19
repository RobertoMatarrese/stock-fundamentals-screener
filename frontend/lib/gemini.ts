const MODEL = "gemini-3-flash-preview";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const RETRYABLE_STATUSES = new Set([429, 503]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The free-tier preview model returns 503 ("high demand") often enough in
// practice that a single attempt isn't reliable -- retry a couple of times
// before giving up.
async function fetchWithRetry(url: string, body: unknown) {
  let lastStatus = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return response.json();
    }

    lastStatus = response.status;
    if (!RETRYABLE_STATUSES.has(response.status) || attempt === MAX_ATTEMPTS) {
      throw new Error(`Gemini API returned ${response.status}`);
    }

    await sleep(RETRY_DELAY_MS * attempt);
  }

  throw new Error(`Gemini API returned ${lastStatus}`);
}

export interface ChartData {
  tipo: "line" | "bar";
  titolo: string;
  dati: { label: string; valore: number }[];
}

export interface ChatAnswer {
  testo: string;
  grafico: ChartData | null;
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    testo: { type: "STRING" },
    grafico: {
      type: "OBJECT",
      nullable: true,
      properties: {
        tipo: { type: "STRING", enum: ["line", "bar"] },
        titolo: { type: "STRING" },
        dati: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              label: { type: "STRING" },
              valore: { type: "NUMBER" },
            },
            required: ["label", "valore"],
          },
        },
      },
      required: ["tipo", "titolo", "dati"],
    },
  },
  required: ["testo", "grafico"],
};

function buildPrompt(question: string, context: Record<string, unknown>, asOf: string): string {
  return [
    "Sei un assistente che risponde SOLO a domande sui fondamentali finanziari storici di Apple (AAPL).",
    `Usa esclusivamente i dati di contesto forniti qui sotto, aggiornati al ${asOf}. Sono dati reali tratti da bilanci ufficiali (10-K), non previsioni.`,
    "Se il contesto non contiene informazioni sufficienti per rispondere, dillo esplicitamente invece di inventare numeri.",
    "Non commentare il prezzo di mercato live dell'azione: il focus è sui fondamentali (ricavi, utili, margini, cash flow, bilancio).",
    "Se la domanda implica un andamento storico o un trend, popola il campo 'grafico' con i dati rilevanti dal contesto (usa valori in miliardi di USD dove sensato). Altrimenti imposta 'grafico' a null.",
    "",
    `Contesto: ${JSON.stringify(context)}`,
    "",
    `Domanda: ${question}`,
  ].join("\n");
}

export async function synthesizeAnswer(
  question: string,
  context: Record<string, unknown>,
  asOf: string,
): Promise<ChatAnswer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const body = {
    contents: [{ parts: [{ text: buildPrompt(question, context, asOf) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  const data = await fetchWithRetry(`${API_URL}?key=${apiKey}`, body);
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("Gemini response missing expected text content");
  }

  return JSON.parse(text) as ChatAnswer;
}
