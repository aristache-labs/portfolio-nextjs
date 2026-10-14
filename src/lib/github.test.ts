import { afterEach, describe, expect, it, vi } from "vitest";
import { getRepo, getUserStats, listUserRepos } from "./github";

const repoFixture = {
  name: "siphon",
  full_name: "aristache-labs/siphon",
  html_url: "https://github.com/aristache-labs/siphon",
  description: "A thing",
  homepage: "https://siphon.dev",
  language: "TypeScript",
  stargazers_count: 42,
  forks_count: 7,
  open_issues_count: 1,
  topics: ["cli"],
  fork: false,
  archived: false,
  pushed_at: "2026-01-01T00:00:00Z",
};

afterEach(() => vi.restoreAllMocks());

describe("getRepo", () => {
  it("returns a validated repo on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(repoFixture), { status: 200 })),
    );
    const repo = await getRepo("aristache-labs/siphon");
    expect(repo?.stargazers_count).toBe(42);
  });

  it("returns null on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Not Found", { status: 404 })),
    );
    expect(await getRepo("aristache-labs/missing")).toBeNull();
  });

  it("throws on schema mismatch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ name: 1 }), { status: 200 })),
    );
    await expect(getRepo("aristache-labs/bad")).rejects.toThrow();
  });
});

describe("listUserRepos", () => {
  it("returns a validated array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([repoFixture]), { status: 200 })),
    );
    const repos = await listUserRepos("aristache-labs");
    expect(repos).toHaveLength(1);
  });
});

describe("getUserStats", () => {
  const statsResponse = {
    data: {
      user: {
        followers: { totalCount: 112 },
        repositories: {
          totalCount: 61,
          nodes: [{ stargazerCount: 500 }, { stargazerCount: 115 }],
        },
        contributionsCollection: { contributionYears: [2026, 2020, 2015, 2018] },
      },
    },
  };

  it("sums stars and picks the earliest contribution year", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(statsResponse), { status: 200 })),
    );
    const stats = await getUserStats("aristache-labs");
    expect(stats).toEqual({
      followers: 112,
      publicRepos: 61,
      totalStars: 615,
      firstContributionYear: 2015,
    });
  });

  it("returns null when the user is absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ data: { user: null } }), { status: 200 })),
    );
    expect(await getUserStats("ghost")).toBeNull();
  });

  it("throws on a non-ok response so the caller can fall back", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 401 })),
    );
    await expect(getUserStats("aristache-labs")).rejects.toThrow();
  });
});
