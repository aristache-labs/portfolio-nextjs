import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const recipients = new Set(["contact@aristache.dev", "no-reply@aristache.dev"]);
const receivedEmail = z.object({
  type: z.literal("email.received"),
  data: z.object({
    email_id: z.string().min(1),
    to: z.array(z.string()),
  }),
});

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !webhookSecret || !from) {
    return NextResponse.json({ error: "Email forwarding is not configured." }, { status: 503 });
  }

  const resend = new Resend(apiKey);
  let event;
  try {
    event = resend.webhooks.verify({
      payload: await req.text(),
      headers: {
        id: req.headers.get("svix-id") ?? "",
        timestamp: req.headers.get("svix-timestamp") ?? "",
        signature: req.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    });
  } catch {
    return NextResponse.json({ error: "Invalid webhook." }, { status: 400 });
  }

  if (event?.type !== "email.received") {
    return NextResponse.json({ ok: true });
  }

  const parsed = receivedEmail.safeParse(event);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email event." }, { status: 400 });
  }
  const { email_id: emailId, to } = parsed.data.data;
  if (!to.some((address) => recipients.has(address.trim().toLowerCase()))) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { error } = await resend.emails.receiving.forward(
      { emailId, from, to: "ad.cristache@gmail.com" },
      // Resend retains sending idempotency keys for 24 hours.
      { idempotencyKey: `inbound-forward/${emailId}` },
    );
    if (error) {
      return NextResponse.json({ error: "Could not forward the email." }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Could not forward the email." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
