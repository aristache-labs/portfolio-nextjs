import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { clientIpFromHeaders, createRateLimiter } from "@/lib/rate-limit";

const limit = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

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

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  const from = process.env.RESEND_FROM_EMAIL;
  const templateId = process.env.RESEND_CONTACT_TEMPLATE_ID;
  if (!apiKey || !to || !from || !templateId) {
    return NextResponse.json({ error: "Messages are not set up yet." }, { status: 503 });
  }

  const escapedMessage = escapeHtml(message);
  // Resend limits each template variable to 2000 characters, including HTML entities.
  if (escapedMessage.length > 2000) {
    return NextResponse.json(
      { error: "Message is too long after HTML encoding. Please shorten it." },
      { status: 400 },
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `Contact: ${subject}`,
    template: {
      id: templateId,
      variables: {
        CONTACT_NAME: escapeHtml(name),
        CONTACT_EMAIL: escapeHtml(email),
        CONTACT_SUBJECT: escapeHtml(subject),
        CONTACT_MESSAGE: escapedMessage,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: "Could not send the message." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
