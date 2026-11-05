import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimits } from "@/db/schema";

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Persistent fixed-window limiter backed by Postgres, so the cap holds across serverless
 * instances. One atomic upsert per call: a new or expired window restarts at 1, otherwise the
 * counter increments. Fails open on a database error, because a broken limiter must not stop a
 * real visitor from reaching me.
 */
export function createDbRateLimiter(opts: { limit: number; windowMs: number; prefix: string }) {
  const { limit, windowMs, prefix } = opts;
  return async function check(key: string): Promise<RateLimitResult> {
    const id = `${prefix}:${key}`.slice(0, 255);
    const resetAt = new Date(Date.now() + windowMs);
    try {
      const [row] = await db
        .insert(rateLimits)
        .values({ key: id, count: 1, resetAt })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: {
            count: sql`CASE WHEN ${rateLimits.resetAt} <= now() THEN 1 ELSE ${rateLimits.count} + 1 END`,
            resetAt: sql`CASE WHEN ${rateLimits.resetAt} <= now() THEN ${resetAt.toISOString()}::timestamptz ELSE ${rateLimits.resetAt} END`,
          },
        })
        .returning({ count: rateLimits.count, resetAt: rateLimits.resetAt });
      return {
        success: row.count <= limit,
        remaining: Math.max(0, limit - row.count),
        resetAt: row.resetAt.getTime(),
      };
    } catch {
      return { success: true, remaining: limit, resetAt: resetAt.getTime() };
    }
  };
}
