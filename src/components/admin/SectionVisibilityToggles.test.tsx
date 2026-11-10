import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSectionVisibility } from "@/app/admin/actions";
import { SectionVisibilityToggles } from "./SectionVisibilityToggles";

vi.mock("@/app/admin/actions", () => ({ setSectionVisibility: vi.fn() }));
beforeEach(() => {
  vi.mocked(setSectionVisibility).mockResolvedValue(undefined);
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("homepage effect settings", () => {
  it("defaults both effects to enabled", () => {
    render(<SectionVisibilityToggles visibility={{}} kind="effects" />);
    expect(screen.getByRole("switch", { name: "Terminal intro" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("switch", { name: "Shift your perspective" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("saves each effect independently and allows enabling it again", async () => {
    render(
      <SectionVisibilityToggles
        visibility={{ intro: false, rotateHint: true, skills: false }}
        kind="effects"
      />,
    );
    const intro = screen.getByRole("switch", { name: "Terminal intro" });
    const rotate = screen.getByRole("switch", { name: "Shift your perspective" });
    fireEvent.click(intro);
    await waitFor(() => expect(intro).toBeEnabled());
    expect(setSectionVisibility).toHaveBeenLastCalledWith({ intro: true });
    expect(rotate).toHaveAttribute("aria-checked", "true");
    fireEvent.click(rotate);
    await waitFor(() => expect(rotate).toBeEnabled());
    expect(setSectionVisibility).toHaveBeenLastCalledWith({ rotateHint: false });
    expect(intro).toHaveAttribute("aria-checked", "true");
  });

  it("rolls back and announces a failed save", async () => {
    vi.mocked(setSectionVisibility).mockRejectedValue(new Error("Save failed"));
    render(<SectionVisibilityToggles visibility={{}} kind="effects" />);
    const intro = screen.getByRole("switch", { name: "Terminal intro" });
    fireEvent.click(intro);
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save");
    expect(intro).toHaveAttribute("aria-checked", "true");
    expect(intro).toBeEnabled();
  });
});
