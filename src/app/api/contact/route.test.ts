// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { send, allowRequest } = vi.hoisted(() => ({
  send: vi.fn(),
  allowRequest: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  clientIpFromHeaders: () => "127.0.0.1",
  createRateLimiter: () => allowRequest,
}));

import { POST } from "./route";

const validMessage = {
  name: "Alex & Team",
  email: "alex@example.com",
  subject: "Project Collaboration",
  message: 'Hello <team> & "Adrian"!\nLet us discuss a project.',
};

function request(data = validMessage) {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

describe("contact template delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("RESEND_FROM_EMAIL", "Portfolio <mail@example.com>");
    vi.stubEnv("CONTACT_EMAIL", "owner@example.com");
    vi.stubEnv("RESEND_CONTACT_TEMPLATE_ID", "portfolio-contact");
    allowRequest.mockReturnValue({ success: true });
    send.mockResolvedValue({ error: null });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("uses the hosted template, escapes visitor content, and keeps reply-to", async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(send).toHaveBeenCalledExactlyOnceWith({
      from: "Portfolio <mail@example.com>",
      to: "owner@example.com",
      replyTo: "alex@example.com",
      subject: "Contact: Project Collaboration",
      template: {
        id: "portfolio-contact",
        variables: {
          CONTACT_NAME: "Alex &amp; Team",
          CONTACT_EMAIL: "alex@example.com",
          CONTACT_SUBJECT: "Project Collaboration",
          CONTACT_MESSAGE:
            "Hello &lt;team&gt; &amp; &quot;Adrian&quot;!\nLet us discuss a project.",
        },
      },
    });
  });

  it("does not send when the template is not configured", async () => {
    vi.stubEnv("RESEND_CONTACT_TEMPLATE_ID", "");

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });

  it("reports a delivery failure when Resend rejects the template", async () => {
    send.mockResolvedValue({ error: { message: "Template is not published" } });

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Could not send the message." });
  });

  it("accepts a message at the template variable limit", async () => {
    const response = await POST(request({ ...validMessage, message: "a".repeat(2000) }));

    expect(response.status).toBe(200);
    expect(send).toHaveBeenCalledOnce();
  });

  it("rejects content that exceeds the variable limit after escaping", async () => {
    const response = await POST(request({ ...validMessage, message: "&".repeat(401) }));

    expect(response.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps rate-limited requests from sending", async () => {
    allowRequest.mockReturnValue({ success: false });

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(send).not.toHaveBeenCalled();
  });
});
