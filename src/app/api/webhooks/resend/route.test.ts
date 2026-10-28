// @vitest-environment node
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { forward } = vi.hoisted(() => ({ forward: vi.fn() }));

vi.mock("resend", async (importOriginal) => {
  const actual = await importOriginal<typeof import("resend")>();
  return {
    ...actual,
    Resend: class extends actual.Resend {
      constructor(key: string) {
        super(key);
        this.emails.receiving.forward = forward;
      }
    },
  };
});

import { POST } from "./route";

const secretBytes = Buffer.from("webhook-test-secret");
const secret = `whsec_${secretBytes.toString("base64")}`;
const emailId = "a128c139-22d6-4a76-bc3a-0123456789ab";

function request(
  to = ["contact@aristache.dev"],
  options: { payload?: string; timestamp?: string; signedPayload?: string } = {},
) {
  const payload =
    options.payload ?? JSON.stringify({ type: "email.received", data: { email_id: emailId, to } });
  const timestamp = options.timestamp ?? String(Math.floor(Date.now() / 1000));
  const id = "msg_test";
  const signature = createHmac("sha256", secretBytes)
    .update(`${id}.${timestamp}.${options.signedPayload ?? payload}`)
    .digest("base64");

  return new NextRequest("http://localhost/api/webhooks/resend", {
    method: "POST",
    body: payload,
    headers: {
      "Content-Type": "application/json",
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": `v1,${signature}`,
    },
  });
}

describe("incoming email forwarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("RESEND_FROM_EMAIL", "Aristache <no-reply@aristache.dev>");
    vi.stubEnv("RESEND_WEBHOOK_SECRET", secret);
    forward.mockResolvedValue({ data: { id: "forwarded-email" }, error: null });
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each(["contact@aristache.dev", "no-reply@aristache.dev", " CONTACT@ARISTACHE.DEV "])(
    "forwards signed mail for %s to the fixed Gmail destination",
    async (address) => {
      const response = await POST(request([address]));

      expect(response.status).toBe(200);
      expect(forward).toHaveBeenCalledExactlyOnceWith(
        {
          emailId,
          from: "Aristache <no-reply@aristache.dev>",
          to: "ad.cristache@gmail.com",
        },
        { idempotencyKey: `inbound-forward/${emailId}` },
      );
    },
  );

  it("forwards once when both inboxes receive the same message", async () => {
    const response = await POST(request(["contact@aristache.dev", "no-reply@aristache.dev"]));

    expect(response.status).toBe(200);
    expect(forward).toHaveBeenCalledOnce();
  });

  it("reuses the sending idempotency key across webhook retries", async () => {
    await POST(request());
    await POST(request());

    expect(forward).toHaveBeenCalledTimes(2);
    expect(forward.mock.calls[0][1]).toEqual(forward.mock.calls[1][1]);
  });

  it.each([
    ["someone@aristache.dev"],
    ["contact@aristache.dev.attacker.com"],
    ["no-reply@other.dev"],
    ["ad.cristache@gmail.com"],
    [],
  ])("ignores mail for unrelated recipients: %j", async (...addresses) => {
    const response = await POST(request(addresses));

    expect(response.status).toBe(200);
    expect(forward).not.toHaveBeenCalled();
  });

  it("ignores other signed event types", async () => {
    const response = await POST(request([], { payload: JSON.stringify({ type: "email.sent" }) }));

    expect(response.status).toBe(200);
    expect(forward).not.toHaveBeenCalled();
  });

  it("rejects missing signature headers", async () => {
    const req = request();
    req.headers.delete("svix-signature");

    expect((await POST(req)).status).toBe(400);
    expect(forward).not.toHaveBeenCalled();
  });

  it("rejects a modified request body", async () => {
    const response = await POST(request(undefined, { signedPayload: "different body" }));

    expect(response.status).toBe(400);
    expect(forward).not.toHaveBeenCalled();
  });

  it("rejects an expired signature", async () => {
    const timestamp = String(Math.floor(Date.now() / 1000) - 600);
    const response = await POST(request(undefined, { timestamp }));

    expect(response.status).toBe(400);
    expect(forward).not.toHaveBeenCalled();
  });

  it.each([
    "not JSON",
    JSON.stringify({ type: "email.received", data: {} }),
    JSON.stringify({ type: "email.received", data: { email_id: "", to: [] } }),
    JSON.stringify({
      type: "email.received",
      data: { email_id: emailId, to: "contact@aristache.dev" },
    }),
  ])("rejects invalid signed payloads: %s", async (payload) => {
    expect((await POST(request(undefined, { payload }))).status).toBe(400);
    expect(forward).not.toHaveBeenCalled();
  });

  it.each(["RESEND_API_KEY", "RESEND_FROM_EMAIL", "RESEND_WEBHOOK_SECRET"])(
    "fails closed without %s",
    async (name) => {
      vi.stubEnv(name, "");

      expect((await POST(request())).status).toBe(503);
      expect(forward).not.toHaveBeenCalled();
    },
  );

  it("returns a retryable error when Resend rejects forwarding", async () => {
    forward.mockResolvedValue({ error: { message: "Internal provider detail" } });

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Could not forward the email." });
  });

  it("returns a retryable error when fetching the original email throws", async () => {
    forward.mockRejectedValue(new Error("Download failed"));

    expect((await POST(request())).status).toBe(502);
  });
});
