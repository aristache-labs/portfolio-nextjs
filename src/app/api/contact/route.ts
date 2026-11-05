import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { clientIpFromHeaders } from "@/lib/client-ip";
import { createDbRateLimiter } from "@/lib/rate-limit-db";
import { contactSchema } from "@/lib/contact-schema";

const limit = createDbRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000, prefix: "contact" });

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  if (!(await limit(clientIpFromHeaders(req.headers))).success) {
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

  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { name, email, subject, message } = parsed.data;

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
