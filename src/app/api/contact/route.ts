import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { BRAND } from "@/lib/brand";
import { SITE } from "@/lib/seo/site";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/rate-limit";

const limit = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

// Must match data-action on the widget in Contact.tsx.
const TURNSTILE_ACTION = "contact";
// The frontend host Turnstile must report. Derived from the site URL, so production
// (www.aristache.dev) never accepts localhost.
const TURNSTILE_HOSTNAME = new URL(SITE.url).hostname;

const SUBJECTS = new Set([
  "Project Collaboration",
  "Job Opportunity",
  "Freelance Work",
  "General Question",
]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const result = (await res.json()) as { success?: boolean; action?: string; hostname?: string };
    return (
      result.success === true &&
      result.action === TURNSTILE_ACTION &&
      result.hostname === TURNSTILE_HOSTNAME
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!limit(clientIpFromHeaders(req.headers)).success) {
    return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const data = (body ?? {}) as Record<string, unknown>;
  if (typeof data.website === "string" && data.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const subject = typeof data.subject === "string" ? data.subject.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";

  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Add your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) {
    return NextResponse.json({ error: "Add a valid email." }, { status: 400 });
  }
  if (!SUBJECTS.has(subject)) {
    return NextResponse.json({ error: "Choose a subject." }, { status: 400 });
  }
  if (message.length < 10 || message.length > 2000) {
    return NextResponse.json(
      { error: "Message should be 10 to 2000 characters." },
      { status: 400 },
    );
  }

  const turnstileToken = typeof data.turnstileToken === "string" ? data.turnstileToken : "";
  if (
    !turnstileToken ||
    !(await verifyTurnstile(turnstileToken, clientIpFromHeaders(req.headers)))
  ) {
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    return NextResponse.json({ error: "Messages are not set up yet." }, { status: 503 });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `Contact: ${subject}`,
    html: `
      <h2>New message from the site</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <blockquote style="border-left:3px solid ${BRAND.deep};padding-left:12px;color:#444">
        ${escapeHtml(message)}
      </blockquote>
    `,
  });

  if (error) {
    return NextResponse.json({ error: "Could not send the message." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
