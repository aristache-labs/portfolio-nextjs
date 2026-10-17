import { describe, expect, it } from "vitest";
import { GET } from "../llms.txt/route";

describe("llms.txt", () => {
  it("serves plain text with the entity-first identity", async () => {
    const res = await GET();
    expect(res.headers.get("Content-Type")).toMatch(/text\/plain/);
    const text = await res.text();
    expect(text).toContain("Cristache Adrian");
    expect(text).toContain("llms-full.txt");
  });

  it("contains the identity section", async () => {
    const res = await GET();
    const text = await res.text();
    expect(text).toContain("## Identity");
    expect(text).toContain("aristache-labs");
  });

  it("contains GitHub link", async () => {
    const res = await GET();
    const text = await res.text();
    expect(text).toContain("github.com/aristache-labs");
  });
});
