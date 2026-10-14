import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders the monogram with an accessible Aristache name", () => {
    render(<Logo />);
    expect(screen.getByRole("img", { name: /aristache/i })).toBeInTheDocument();
  });

  it("renders wordmark 'aristache' when withWordmark is true", () => {
    render(<Logo withWordmark />);
    expect(screen.getByText("Aristache")).toBeInTheDocument();
  });

  it("does NOT render wordmark by default", () => {
    render(<Logo />);
    expect(screen.queryByText("aristache")).not.toBeInTheDocument();
  });
});
