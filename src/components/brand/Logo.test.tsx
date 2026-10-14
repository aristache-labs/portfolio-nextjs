import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders an svg with accessible name matching /cristache adrian/i", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: /cristache adrian/i })).toBeInTheDocument();
  });

  it("renders wordmark 'aristache' when withWordmark is true", () => {
    render(<Logo withWordmark />);
    expect(screen.getByText("aristache")).toBeInTheDocument();
  });

  it("does NOT render wordmark by default", () => {
    render(<Logo />);
    expect(screen.queryByText("aristache")).not.toBeInTheDocument();
  });
});
