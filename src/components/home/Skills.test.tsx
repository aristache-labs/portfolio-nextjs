import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { installMatchMedia } from "@/test/matchMedia";
import { Skills } from "./Skills";

vi.mock("framer-motion", () => {
  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        const Comp = ({
          children,
          className,
          role,
          onClick,
          href,
          type,
          "aria-selected": ariaSelected,
        }: {
          children?: React.ReactNode;
          className?: string;
          role?: string;
          onClick?: () => void;
          href?: string;
          type?: "button" | "submit" | "reset";
          "aria-selected"?: boolean;
        }) => {
          return createElement(
            tag,
            { className, role, onClick, href, type, "aria-selected": ariaSelected },
            children,
          );
        };
        return Comp;
      },
    },
  );
  return {
    m: motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const mockSkills = [
  { name: "React", iconPath: "/skills/react.svg", category: "Frontend", order: 1, level: "Expert" },
  { name: "TypeScript", iconPath: "/skills/typescript.svg", category: "Frontend", order: 2 },
  { name: "Node.js", iconPath: "/skills/nodejs.svg", category: "Backend", order: 3 },
  { name: "PostgreSQL", iconPath: "/skills/postgresql.svg", category: "Backend", order: 4 },
];

describe("Skills", () => {
  beforeEach(() => installMatchMedia());

  it("renders skill names", () => {
    render(<Skills skills={mockSkills} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });

  it("renders category filters from the skill list", () => {
    render(<Skills skills={mockSkills} />);
    expect(screen.getByRole("tab", { name: "Frontend" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Backend" })).toBeInTheDocument();
  });

  it("renders section heading", () => {
    render(<Skills skills={mockSkills} />);
    expect(screen.getByText("Technologies and")).toBeInTheDocument();
    expect(screen.getByText("tools")).toBeInTheDocument();
  });

  it("shows the level as a percent", () => {
    render(<Skills skills={mockSkills} />);
    expect(screen.getByText("90%")).toBeInTheDocument();
  });

  it("filters to the selected category", () => {
    render(<Skills skills={mockSkills} />);
    fireEvent.click(screen.getByRole("tab", { name: "Backend" }));
    expect(screen.queryByText("React")).not.toBeInTheDocument();
    expect(screen.getByText("Node.js")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });

  it("shows eight skills on Most Used and the rest inside a category", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      name: `Skill ${i}`,
      iconPath: "/skills/x.svg",
      category: i === 8 ? "Extra" : "Frontend",
      order: i,
    }));
    render(<Skills skills={many} />);
    expect(screen.getAllByText(/^Skill \d$/)).toHaveLength(8);
    expect(screen.queryByText("Skill 8")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Extra" }));
    expect(screen.getByText("Skill 8")).toBeInTheDocument();
  });

  it("ranks Most Used by level then admin order and keeps stored names", () => {
    const ranked = [
      { name: "Missing", order: 0, level: null },
      { name: "Zero", order: 1, level: "0" },
      { name: "Invalid", order: 0, level: "invalid" },
      { name: "Numeric", order: 4, level: "90" },
      { name: "Legacy", order: 2, level: "Expert" },
      { name: "Highest", order: 20, level: "100" },
      { name: "Middle", order: 3, level: "Intermediate" },
      { name: "Beginner", order: 5, level: "Beginner" },
      { name: "Other", order: 6, level: "80" },
      { name: "Last rated", order: 7, level: "10" },
    ].map((skill) => ({ ...skill, category: "Development", iconPath: "/skills/x.svg" }));
    const { container } = render(<Skills skills={ranked} />);
    const names = () =>
      Array.from(container.querySelectorAll("[title]")).map((node) => node.getAttribute("title"));
    const expected = [
      "Highest",
      "Legacy",
      "Numeric",
      "Other",
      "Middle",
      "Beginner",
      "Last rated",
      "Zero",
    ];
    expect(screen.getByRole("tab", { name: "Most Used" })).toHaveAttribute("aria-selected", "true");
    expect(names()).toEqual(expected);
    fireEvent.click(screen.getByRole("tab", { name: "Development" }));
    expect(names()).toHaveLength(10);
    expect(names()[0]).toBe("Missing");
    fireEvent.click(screen.getByRole("tab", { name: "Most Used" }));
    expect(names()).toEqual(expected);
    expect(ranked[0].name).toBe("Missing");
  });

  it("renders the skills section with correct id", () => {
    const { container } = render(<Skills skills={mockSkills} />);
    expect(container.querySelector("#skills")).toBeTruthy();
  });

  it("renders an empty state gracefully", () => {
    render(<Skills skills={[]} />);
    expect(screen.getByText("Technologies and")).toBeInTheDocument();
  });
});
