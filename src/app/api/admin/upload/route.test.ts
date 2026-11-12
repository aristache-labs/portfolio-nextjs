// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => vi.fn());
const uploadIcon = vi.hoisted(() => vi.fn());

vi.mock("@/auth", () => ({ auth }));
vi.mock("@/lib/blob", () => ({
  BLOB_FOLDERS: { hero: "hero", avatar: "avatar", skills: "skills", projects: "projects" },
  MAX_BYTES: 5 * 1024 * 1024,
  uploadAvatar: vi.fn(),
  uploadProjectMedia: vi.fn(),
  uploadIcon,
}));

import { POST } from "./route";

function upload(
  folder: string,
  file: File | null = new File(["x"], "a.png", { type: "image/png" }),
) {
  const body = new FormData();
  if (file) body.set("file", file);
  body.set("folder", folder);
  return new NextRequest("http://localhost/api/admin/upload", { method: "POST", body });
}

describe("admin upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { name: "admin" } });
    uploadIcon.mockResolvedValue("https://cdn.example/skills/a.webp");
  });

  it("refuses a request without a session", async () => {
    auth.mockResolvedValue(null);
    expect((await POST(upload("skills"))).status).toBe(401);
    expect(uploadIcon).not.toHaveBeenCalled();
  });

  it("only writes to the folders the admin uploader owns", async () => {
    expect((await POST(upload("hero"))).status).toBe(400);
    expect(uploadIcon).not.toHaveBeenCalled();
  });

  it("answers 413 before reading a body that is far over the cap", async () => {
    const request = upload("skills");
    request.headers.set("content-length", String(50 * 1024 * 1024));
    const formData = vi.spyOn(request, "formData");
    expect((await POST(request)).status).toBe(413);
    expect(formData).not.toHaveBeenCalled();
  });

  it("returns the stored url for a valid upload", async () => {
    const response = await POST(upload("skills"));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ url: "https://cdn.example/skills/a.webp" });
  });

  it("passes an upload error message back as a 400", async () => {
    uploadIcon.mockRejectedValue(new Error("Unsupported image type: image/svg+xml"));
    const response = await POST(
      upload("skills", new File(["<svg/>"], "a.svg", { type: "image/svg+xml" })),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Unsupported image type: image/svg+xml" });
  });
});
