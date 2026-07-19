import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// "2 questions per session" is enforced per IP over a rolling day rather
// than per browser session/cookie -- a cookie-based session resets the
// moment someone clears cookies or opens a private window, which defeats
// the actual goal here (protecting the shared free Gemini quota from
// being drained). IP is harder to casually reset.
// TODO: temporarily raised for testing -- put back to 2 before considering this "done".
const MAX_QUESTIONS_PER_WINDOW = 2;
const WINDOW = "1 d";

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set");
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.fixedWindow(MAX_QUESTIONS_PER_WINDOW, WINDOW),
    prefix: "apple-chat",
  });

  return ratelimit;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const { success, remaining, limit } = await getRatelimit().limit(identifier);
  return { allowed: success, remaining, limit };
}
