/**
 * Extracts the client IP from request headers. `x-real-ip` is set by the platform itself, so a
 * visitor cannot choose it. The first `x-forwarded-for` value is whatever the visitor wrote, so it
 * is only a fallback for hosts that do not set `x-real-ip`.
 *
 * shortcut: requests with neither header share one "unknown" bucket, and rate limits count them
 * together; fine behind Vercel, revisit if this runs where neither header is set.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return "unknown";
}
