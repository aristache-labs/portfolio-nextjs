import { describe, expect, it, vi, beforeEach } from "vitest";

// Hoist mockAuth so it can be referenced inside the vi.mock factory (which is hoisted)
const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

// Mock DB so no DATABASE_URL is needed
vi.mock("@/db/client", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([{ id: 1 }]) }),
    }),
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    }),
    delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
  },
}));

// Mock next/cache so revalidatePath and revalidateTag are no-ops in tests
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

// Auth mock — default to unauthenticated; individual tests override
vi.mock("@/auth", () => ({ auth: mockAuth }));

import {
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  updateProfile,
  setSectionVisibility,
} from "./actions";

function authedSession() {
  return { user: { name: "Admin", email: "admin@example.com" } };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAdmin guard", () => {
  it("throws Unauthorized when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(
      createProject({
        repo: "test-repo",
        title: "Test",
        tags: [],
        featured: false,
        order: 0,
        hidden: false,
        screenshots: [],
      }),
    ).rejects.toThrow("Unauthorized");
  });

  it("throws Unauthorized when session has no user", async () => {
    mockAuth.mockResolvedValue({ user: null });
    await expect(deleteProject(1)).rejects.toThrow("Unauthorized");
  });

  it("allows action when session has a user", async () => {
    mockAuth.mockResolvedValue(authedSession());
    await expect(deleteProject(1)).resolves.toBeUndefined();
  });
});

describe("zod validation", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue(authedSession());
  });

  it("rejects a project with an invalid repo slug (URL instead of slug)", async () => {
    await expect(
      createProject({
        repo: "https://github.com/aristache-labs/test",
        title: "Test",
        tags: [],
        featured: false,
        order: 0,
        hidden: false,
        screenshots: [],
      }),
    ).rejects.toThrow();
  });

  it("rejects a project with an empty title", async () => {
    await expect(
      createProject({
        repo: "valid-repo",
        title: "",
        tags: [],
        featured: false,
        order: 0,
        hidden: false,
        screenshots: [],
      }),
    ).rejects.toThrow();
  });

  it("accepts a valid project", async () => {
    await expect(
      createProject({
        repo: "valid-repo",
        title: "Valid",
        tags: [],
        featured: false,
        order: 0,
        hidden: false,
        screenshots: [],
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects updateProfile with empty name", async () => {
    await expect(
      updateProfile({
        name: "",
        email: null,
        bio: "b",
        stats: {},
        roles: [],
        sectionVisibility: {},
      }),
    ).rejects.toThrow();
  });

  it("rejects reorderProjects with non-integer id", async () => {
    await expect(reorderProjects({ items: [{ id: 1.5, order: 0 }] })).rejects.toThrow();
  });

  it("accepts valid reorderProjects input", async () => {
    await expect(
      reorderProjects({
        items: [
          { id: 1, order: 0 },
          { id: 2, order: 1 },
        ],
      }),
    ).resolves.toBeUndefined();
  });

  it("accepts valid updateProject input", async () => {
    await expect(
      updateProject(1, {
        repo: "repo-slug",
        title: "T",
        tags: [],
        featured: false,
        order: 0,
        hidden: false,
        screenshots: [],
      }),
    ).resolves.toBeUndefined();
  });
});

describe("effect settings", () => {
  it("requires authentication before changing effect visibility", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(setSectionVisibility({ intro: false })).rejects.toThrow("Unauthorized");
  });

  it("saves effect flags and invalidates the homepage", async () => {
    mockAuth.mockResolvedValue(authedSession());
    await expect(
      setSectionVisibility({ intro: false, rotateHint: false }),
    ).resolves.toBeUndefined();
    const { revalidatePath } = await import("next/cache");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

it("does not overwrite saved effects from a stale profile form", async () => {
  mockAuth.mockResolvedValue(authedSession());
  await updateProfile({
    name: "Admin",
    email: null,
    bio: "Bio",
    stats: {},
    roles: [],
    sectionVisibility: { intro: true, rotateHint: true },
  });
  const { db } = await import("@/db/client");
  const saved = vi.mocked(db.update).mock.results.at(-1)!.value.set.mock.calls.at(-1)[0];
  expect(saved).not.toHaveProperty("sectionVisibility");
});
