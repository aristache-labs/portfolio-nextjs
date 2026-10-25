import { describe, expect, it } from "vitest";
import { GET } from "../llms.txt/route";

describe("llms.txt", () => {
  it("serves plain text with the entity-first identity", async () => {
    const res = await GET();
    expect(res.headers.get("Content-Type")).toMatch(/text\/plain/);
    const text = await res.text();
    expect(text).toContain("Adrian Cristache");
    expect(text).toContain("IT Specialist · Web & Mobile Developer");
    expect(text).toContain("llms-full.txt");
  });

  it("follows the llms.txt file-list shape", async () => {
    const res = await GET();
    const text = await res.text();
    expect(text).toContain("> ");
    expect(text).toContain("aristache-labs");
    expect(text).toContain("## Profile");
    expect(text).toContain("## Optional");
    expect(text).toMatch(/- \[Full profile\]\(https?:\/\/.+\/llms-full\.txt\):/);
    expect(text).toMatch(/- \[GitHub\]\(https:\/\/github\.com\/aristache-labs\):/);
    expect(text).not.toContain("## Identity");
  });
});
