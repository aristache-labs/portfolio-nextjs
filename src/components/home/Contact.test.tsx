import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { installMatchMedia } from "@/test/matchMedia";
import { EXPRESSIVE_MOTION_QUERY, REDUCED_MOTION_QUERY } from "@/hooks/useAnimationPolicy";
import { Contact, platformIcon } from "./Contact";
import type { SocialRow } from "./Contact";
import { Github, Linkedin, Instagram, Send, Mail, Globe } from "lucide-react";
import { XIcon } from "@/components/brand/XIcon";
import { MotionProvider } from "@/components/motion/MotionProvider";

vi.mock("next/font/google", () => ({
  Merienda: () => ({ className: "quote-font", style: { fontFamily: "Merienda" } }),
}));

// Magnetic renders for real and reads matchMedia via useReducedMotion
beforeEach(() => installMatchMedia());
afterEach(() => vi.restoreAllMocks());

const mockSocials: SocialRow[] = [
  {
    platform: "github",
    url: "https://github.com/aristache-labs",
    username: "aristache-labs",
    order: 1,
  },
  {
    platform: "linkedin",
    url: "https://linkedin.com/in/aristache-labs",
    username: "aristache-labs",
    order: 2,
  },
  {
    platform: "twitter",
    url: "https://twitter.com/aristache-labs",
    username: "aristache-labs",
    order: 3,
  },
];

describe("platformIcon", () => {
  it("returns Github icon for github", () => expect(platformIcon("github")).toBe(Github));
  it("returns Linkedin icon for linkedin", () => expect(platformIcon("linkedin")).toBe(Linkedin));
  it("returns X icon for twitter", () => expect(platformIcon("twitter")).toBe(XIcon));
  it("returns X icon for x", () => expect(platformIcon("x")).toBe(XIcon));
  it("returns Instagram icon for instagram", () =>
    expect(platformIcon("instagram")).toBe(Instagram));
  it("returns Send icon for telegram", () => expect(platformIcon("telegram")).toBe(Send));
  it("returns Mail icon for email", () => expect(platformIcon("email")).toBe(Mail));
  it("returns Globe icon for unknown platform", () => expect(platformIcon("unknown")).toBe(Globe));
  it("is case-insensitive", () => expect(platformIcon("GitHub")).toBe(Github));
});

describe("Contact", () => {
  const email = "hello@example.com";

  it("animates the numbered label together with the contact title", () => {
    render(<Contact socials={mockSocials} email={email} number="05" />);
    const heading = screen.getByRole("heading", { name: "Discuss a project." });
    expect(heading.parentElement?.querySelector("p")).toHaveTextContent("05Contact");
    expect(heading.parentElement?.querySelector("h2")).toBe(heading);
  });

  it.each([
    [1440, 900, true],
    [390, 844, false],
    [844, 390, false],
  ])(
    "reveals the pending form on focus without losing edits at %sx%s",
    async (width, height, desktop) => {
      installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: desktop });
      vi.stubGlobal("innerWidth", width);
      vi.stubGlobal("innerHeight", height);
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          observe() {}
          disconnect() {}
        },
      );
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
        top: 2000,
        left: 0,
      } as DOMRect);
      const { container, unmount } = render(
        <MotionProvider>
          <Contact socials={mockSocials} email={email} />
        </MotionProvider>,
      );
      try {
        const form = container.querySelector("form")!;
        const entrance = form.parentElement!;
        await waitFor(() => expect(entrance).toHaveStyle({ opacity: "0" }));
        fillForm();
        act(() => screen.getByLabelText("Your Name").focus());
        await waitFor(() => expect(entrance).toHaveStyle({ opacity: "1", transform: "none" }));
        expect(container.querySelector("form")).toBe(form);
        expect(screen.getByLabelText("Your Name")).toHaveValue("Test User");
        expect(screen.getByLabelText("Message")).toHaveValue("A project question for testing.");
      } finally {
        unmount();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
      }
    },
  );

  function fillForm() {
    fireEvent.change(screen.getByLabelText("Your Name"), { target: { value: "Test User" } });
    fireEvent.change(screen.getByLabelText("Your Email"), {
      target: { value: "sender@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "General Question" } });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "A project question for testing." },
    });
  }

  it("serves visible copy, contact links and form fields before hydration", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Contact socials={mockSocials} email={email} />);
    expect(container.querySelectorAll("input, select, textarea")).toHaveLength(4);
    for (const element of container.querySelectorAll("h2, h3, input, select, textarea, a")) {
      for (let node: Element | null = element; node; node = node.parentElement) {
        expect((node as HTMLElement).style.opacity).not.toBe("0");
      }
    }
  });

  it("keeps the form visible and preserves edits when motion preferences change", () => {
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true });
    const { container, rerender } = render(<Contact socials={mockSocials} email={email} />);
    fillForm();
    installMatchMedia({ [EXPRESSIVE_MOTION_QUERY]: true, [REDUCED_MOTION_QUERY]: true });
    rerender(<Contact socials={[...mockSocials]} email={email} />);
    expect(screen.getByLabelText("Your Name")).toHaveValue("Test User");
    expect(screen.getByLabelText("Message")).toHaveValue("A project question for testing.");
    expect(container.querySelector("form")).toBeVisible();
    expect(container.querySelector("form")?.parentElement).not.toHaveStyle({ opacity: "0" });
  });

  it("submits once while pending and clears fields after success", async () => {
    let resolveRequest!: (response: Response) => void;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { container } = render(<Contact socials={mockSocials} email={email} />);
    fillForm();
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByRole("button", { name: /Sending/ })).toBeDisabled();
    fireEvent.submit(container.querySelector("form")!);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/contact",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "sender@example.com",
          subject: "General Question",
          message: "A project question for testing.",
        }),
      }),
    );
    await act(async () => resolveRequest(Response.json({ success: true })));
    expect(screen.getByRole("status")).toHaveTextContent("Message sent.");
    expect(screen.getByLabelText("Your Name")).toHaveValue("");
    expect(screen.getByLabelText("Message")).toHaveValue("");
  });

  it("keeps edits after an error and allows a successful retry", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ error: "Please try again later." }, { status: 429 }))
      .mockResolvedValueOnce(Response.json({ success: true }));
    const { container } = render(<Contact socials={mockSocials} email={email} />);
    fillForm();
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Please try again later."),
    );
    expect(screen.getByLabelText("Your Email")).toHaveValue("sender@example.com");
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Message sent."));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  describe("deferred quote font", () => {
    const originalObserver = globalThis.IntersectionObserver;
    let notify: IntersectionObserverCallback;
    const disconnect = vi.fn();

    beforeEach(() => {
      disconnect.mockClear();
      vi.stubGlobal(
        "IntersectionObserver",
        class {
          constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
            if (options?.rootMargin === "1200px 0px") notify = callback;
          }
          observe() {}
          unobserve() {}
          disconnect = disconnect;
        },
      );
    });

    afterEach(() => {
      cleanup();
      vi.stubGlobal("IntersectionObserver", originalObserver);
    });

    it("keeps the font inactive until Contact approaches, then keeps it active", () => {
      const { container } = render(<Contact socials={mockSocials} email={email} />);
      const quote = container.querySelector("blockquote p");
      const emit = (isIntersecting: boolean) =>
        act(() =>
          notify([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver),
        );

      expect(quote).not.toHaveClass("quote-font");
      emit(false);
      expect(quote).not.toHaveClass("quote-font");
      emit(true);
      expect(quote).toHaveClass("quote-font");
      expect(disconnect).toHaveBeenCalled();
      emit(false);
      expect(quote).toHaveClass("quote-font");
    });

    it("uses the original font when IntersectionObserver is unavailable", async () => {
      vi.stubGlobal("IntersectionObserver", undefined);
      const { container } = render(<Contact socials={mockSocials} email={email} />);
      await waitFor(() =>
        expect(container.querySelector("blockquote p")).toHaveClass("quote-font"),
      );
    });

    it("preserves the quote and its font for visitors without JavaScript", () => {
      const html = renderToString(<Contact socials={mockSocials} email={email} />);
      expect(html).toContain("The beginning is the most important part of any work.");
      expect(html).toContain("<noscript><style>#contact blockquote p { font-family: Merienda; }");
      expect(html).not.toContain('class="quote-font');
    });
  });

  it("attributes the conversation quote to its source", () => {
    const { container } = render(<Contact socials={mockSocials} email={email} />);
    expect(container.querySelector("blockquote")).toHaveTextContent(
      "The beginning is the most important part of any work.",
    );
    expect(screen.getByRole("link", { name: "Plato" })).toHaveAttribute(
      "href",
      "https://classics.mit.edu/Plato/republic.3.ii.html",
    );
  });

  it("renders the contact section with id='contact'", () => {
    const { container } = render(<Contact socials={mockSocials} email={email} />);
    expect(container.querySelector("#contact")).toBeTruthy();
  });

  it("renders a mailto link with the given email", () => {
    render(<Contact socials={mockSocials} email={email} />);
    const link = screen.getByRole("link", { name: new RegExp(email) });
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe(`mailto:${email}`);
  });

  it("renders only the email and linkedin cards", () => {
    render(<Contact socials={mockSocials} email={email} />);
    expect(screen.getByRole("link", { name: /^linkedin aristache-labs$/i })).toBeTruthy();
    expect(screen.queryByLabelText("github: aristache-labs")).toBeNull();
    expect(screen.queryByLabelText("twitter: aristache-labs")).toBeNull();
    expect(screen.queryByText(/other ways to connect/i)).toBeNull();
  });

  it("opens the linkedin card in a new tab", () => {
    render(<Contact socials={mockSocials} email={email} />);
    const linkedin = screen.getByRole("link", { name: /^linkedin aristache-labs$/i });
    expect(linkedin.getAttribute("href")).toBe("https://linkedin.com/in/aristache-labs");
    expect(linkedin.getAttribute("target")).toBe("_blank");
    expect(linkedin.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders the heading", () => {
    render(<Contact socials={mockSocials} email={email} />);
    expect(screen.getByRole("heading", { level: 2, name: /discuss a project/i })).toBeTruthy();
  });

  it("omits the linkedin card when that profile is not configured", () => {
    render(
      <Contact socials={mockSocials.filter((s) => s.platform !== "linkedin")} email={email} />,
    );
    expect(screen.queryByLabelText(/linkedin/i)).toBeNull();
    expect(screen.getByRole("link", { name: new RegExp(email) })).toBeTruthy();
  });

  it("keeps the support link out of the contact section", () => {
    render(<Contact socials={mockSocials} email={email} />);
    expect(screen.queryByRole("link", { name: /support independent projects/i })).toBeNull();
  });

  it("renders empty social list gracefully", () => {
    render(<Contact socials={[]} email={email} />);
    const link = screen.getByRole("link", { name: new RegExp(email) });
    expect(link).toBeTruthy();
  });
});
