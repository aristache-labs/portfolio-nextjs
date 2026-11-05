import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { fixture } from "@/test/project-fixture";
import { groupProjects } from "@/lib/project-presentation";
import { ProjectQuickView } from "./ProjectQuickView";

vi.mock("./ProjectRepoBadges", () => ({ ProjectRepoBadges: () => null }));
afterEach(cleanup);

it("switches component copy, links and gallery while retaining selector focus", () => {
  const [project] = groupProjects([
    fixture(1, {
      group: "gym",
      title: "App",
      description: "Member application",
      coverImage: "/app.webp",
      screenshots: ["https://example.com/app2.webp"],
    }),
    fixture(2, {
      group: "gym",
      title: "Scanner",
      description: "Desk scanner",
      coverImage: "/scanner.webp",
      homepage: "https://example.com/scanner",
    }),
  ]);
  const onClose = vi.fn();
  const { rerender } = render(<ProjectQuickView project={project} open onClose={onClose} />);
  const selector = screen.getByRole("combobox", { name: "Project component" });
  fireEvent.click(screen.getByRole("button", { name: /next image/i }));
  selector.focus();
  fireEvent.change(selector, { target: { value: "2" } });
  expect(selector).toHaveFocus();
  expect(screen.getByRole("heading", { name: "Scanner" })).toBeVisible();
  expect(screen.getByRole("img", { name: "Scanner poster" }).getAttribute("src")).toContain(
    "scanner.webp",
  );
  expect(screen.getByRole("link", { name: "Live site for Scanner" })).toHaveAttribute(
    "href",
    "https://example.com/scanner",
  );
  fireEvent.keyDown(document.activeElement!, { key: "Escape" });
  expect(onClose).toHaveBeenCalled();
  rerender(<ProjectQuickView project={project} open={false} onClose={onClose} />);
  rerender(<ProjectQuickView project={project} open onClose={onClose} />);
  expect(screen.getByRole("heading", { name: "App" })).toBeVisible();
  expect(screen.getByRole("img", { name: "App poster" })).toBeVisible();
});
