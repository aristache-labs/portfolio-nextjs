import { describe, it, expect, vi, beforeEach } from "vitest";
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
          const El = tag as "div";
          return (
            <El
              className={className}
              role={role}
              onClick={onClick}
              href={href}
              type={type}
              aria-selected={ariaSelected}
            >
              {children}
            </El>
          );
        };
        return Comp;
      },
    },
  );
  return {
    motion,
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
    expect(screen.getByText("Skills that build")).toBeInTheDocument();
    expect(screen.getByText("possibilities")).toBeInTheDocument();
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

  it("shows eight skills on All and the rest inside a category", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({
      name: `Skill ${i}`,
      iconPath: "/skills/x.svg",
      category: i === 8 ? "Extra" : "Frontend",
      order: i,
    }));
    render(<Skills skills={many} />);
    expect(
      screen.getByText("Showing 8 of 9 - select a category to explore everything."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Skill 8")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Extra" }));
    expect(screen.getByText("Skill 8")).toBeInTheDocument();
  });

  it("renders the skills section with correct id", () => {
    const { container } = render(<Skills skills={mockSkills} />);
    expect(container.querySelector("#skills")).toBeTruthy();
  });

  it("renders an empty state gracefully", () => {
    render(<Skills skills={[]} />);
    expect(screen.getByText("Skills that build")).toBeInTheDocument();
  });
});
