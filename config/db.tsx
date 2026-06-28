import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({ client: sql });

export async function withDbRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message =
        error instanceof Error ? error.message : String(error ?? "");
      const isRetryable =
        message.includes("fetch failed") ||
        message.includes("Connect Timeout") ||
        message.includes("ECONNRESET") ||
        message.includes("connection");

      if (!isRetryable || attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw lastError;
}
