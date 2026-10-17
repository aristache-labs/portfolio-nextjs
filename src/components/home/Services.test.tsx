import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { installMatchMedia } from "@/test/matchMedia";
import { Services } from "./Services";
import type { ServiceRow } from "./Services";
import { resolveServiceIcon } from "./ServiceCard";
import { AppWindow, Cloud, Server, Smartphone, Sparkles, Workflow, Wrench } from "lucide-react";

beforeEach(() => installMatchMedia());

// Mock Reveal to render children directly
vi.mock("@/components/motion/Reveal", () => ({
  Reveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockServices: ServiceRow[] = [
  {
    id: 1,
    title: "Web Development",
    description: "Building fast, responsive websites.",
    shortDescription: null,
    icon: "Globe",
    order: 1,
  },
  {
    id: 2,
    title: "Mobile Apps",
    description: "Cross-platform apps with Flutter.",
    shortDescription: null,
    icon: "Smartphone",
    order: 2,
  },
  {
    id: 3,
    title: "API Design",
    description: "RESTful and GraphQL APIs.",
    shortDescription: null,
    icon: "Code",
    order: 3,
  },
];

describe("Services", () => {
  it("renders service titles", () => {
    render(<Services services={mockServices} />);
    expect(screen.getByText("Web Development")).toBeInTheDocument();
    expect(screen.getByText("Mobile Apps")).toBeInTheDocument();
    expect(screen.getByText("API Design")).toBeInTheDocument();
  });

  it("renders service descriptions", () => {
    render(<Services services={mockServices} />);
    expect(screen.getByText("Building fast, responsive websites.")).toBeInTheDocument();
    expect(screen.getByText("Cross-platform apps with Flutter.")).toBeInTheDocument();
  });

  it("renders section heading", () => {
    render(<Services services={mockServices} />);
    expect(screen.getByRole("heading", { name: "What I do" })).toBeInTheDocument();
  });

  it("renders the services section with correct id", () => {
    const { container } = render(<Services services={mockServices} />);
    expect(container.querySelector("#services")).toBeTruthy();
  });

  it("renders empty state gracefully", () => {
    render(<Services services={[]} />);
    expect(screen.getByRole("heading", { name: "What I do" })).toBeInTheDocument();
  });

  it("numbers the cards in display order", () => {
    render(<Services services={mockServices} />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });
});

describe("resolveServiceIcon", () => {
  const byTitle = (title: string) => resolveServiceIcon({ title, icon: null });

  it("picks an icon that represents each seeded service", () => {
    expect(byTitle("Web Applications")).toBe(AppWindow);
    expect(byTitle("Mobile Solutions")).toBe(Smartphone);
    expect(byTitle("Systems & Infrastructure")).toBe(Server);
    expect(byTitle("Automation & Tools")).toBe(Workflow);
    expect(byTitle("Cloud & Integrations")).toBe(Cloud);
    expect(byTitle("IT Support & Troubleshooting")).toBe(Wrench);
  });

  it("prefers a known icon set in admin, and falls back for unknown ones", () => {
    expect(resolveServiceIcon({ title: "Web Applications", icon: "Cloud" })).toBe(Cloud);
    expect(resolveServiceIcon({ title: "Something else", icon: "/icons/web.svg" })).toBe(Sparkles);
  });
});
