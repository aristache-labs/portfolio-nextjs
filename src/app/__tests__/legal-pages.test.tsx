import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LEGAL } from "@/lib/legal";
import { getNavigationProfile } from "@/lib/queries";
import PrivacyPage from "../privacy/page";
import GdprPage from "../gdpr/page";

vi.mock("@/lib/queries", () => ({
  getNavigationProfile: vi.fn(),
  getFundingLinks: async () => [],
  getSocialLinks: async () => [],
}));
vi.mock("@/components/navbar/SiteNav", () => ({
  SiteNav: () => <nav aria-label="Site navigation" />,
}));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => <footer /> }));
vi.mock("@/components/home/SectionBackdrop", () => ({ SectionBackdrop: () => null }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  vi.mocked(getNavigationProfile).mockResolvedValue({
    email: "privacy@example.com",
    heroTagline: null,
    sectionVisibility: { contact: false },
  });
});

async function documentFor(Page: typeof PrivacyPage) {
  const html = renderToStaticMarkup(await Page());
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

describe.each([
  ["Privacy", PrivacyPage],
  ["GDPR", GdprPage],
] as const)("%s notice", (_name, Page) => {
  it("provides a direct privacy contact even when the homepage contact section is hidden", async () => {
    const doc = await documentFor(Page);
    expect(doc.querySelector('article a[href="mailto:privacy@example.com"]')).not.toBeNull();
    expect(doc.querySelector('article a[href="/#contact"]')).toBeNull();
    expect(doc.querySelector("article")).toHaveTextContent("Adrian Cristache");
    expect(doc.querySelector("article")).toHaveTextContent("Romania");
    expect(doc.querySelector("time")).toHaveAttribute("datetime", LEGAL.updatedAt);
  });

  it("keeps a confirmed legal contact when the public email is removed", async () => {
    vi.mocked(getNavigationProfile).mockResolvedValue({
      email: null,
      heroTagline: null,
      sectionVisibility: { contact: false },
    });
    const doc = await documentFor(Page);
    expect(doc.querySelector('article a[href="mailto:' + LEGAL.contactEmail + '"]')).not.toBeNull();
  });

  it("keeps every contents anchor valid and avoids nested main elements", async () => {
    const doc = await documentFor(Page);
    for (const anchor of doc.querySelectorAll('article nav a[href^="#"]')) {
      const target = doc.querySelector(anchor.getAttribute("href")!);
      expect(target?.querySelector("h2")).not.toBeNull();
    }
    expect(doc.querySelectorAll("h1")).toHaveLength(1);
    expect(doc.querySelectorAll("main")).toHaveLength(0);
    expect(doc.querySelector("#page-content")).toHaveAttribute("tabindex", "-1");
  });
});

it("distinguishes email delivery, database storage, retention windows and international processing", async () => {
  const doc = await documentFor(PrivacyPage);
  expect(doc.querySelector("#contact-information")).toHaveTextContent(
    "does not save submissions in the portfolio database",
  );
  expect(doc.querySelector("#legal-bases")).toHaveTextContent("Article 6(1)(f)");
  expect(doc.querySelector("#legal-bases")).toHaveTextContent("Article 6(1)(b)");
  expect(doc.querySelector("#international-transfers")).toHaveTextContent("Frankfurt, Germany");
  expect(doc.querySelector("#international-transfers")).toHaveTextContent("United States");
  expect(doc.querySelector("#retention")).toHaveTextContent("30-day");
  expect(doc.querySelector("#retention")).toHaveTextContent("not an automatic deletion rule");
  for (const host of ["vercel.com", "resend.com", "neon.com", "shields.io"]) {
    expect(
      [...doc.querySelectorAll("article a[href]")].some((a) => {
        try {
          return new URL(a.getAttribute("href")!).hostname === host;
        } catch {
          return false;
        }
      }),
    ).toBe(true);
  }
});

it("explains rights, response timing and the Romanian complaints route", async () => {
  const doc = await documentFor(GdprPage);
  expect(doc.querySelector("#your-rights")).toHaveTextContent(
    "processing is automated and based on consent or a contract",
  );
  expect(doc.querySelector("#objection-and-consent")).toHaveTextContent("you may object");
  expect(doc.querySelector("#response-time")).toHaveTextContent("within one month");
  expect(doc.querySelector("#response-time")).toHaveTextContent("two further months");
  expect(doc.querySelector("#make-a-request")).toHaveTextContent("Requests are normally free");
  expect(doc.querySelector("#raise-a-concern a")).toHaveAttribute(
    "href",
    "https://www.dataprotection.ro/?page=Plangeri_pagina_principala",
  );
});

it("describes the verified analytics retention and enabled measurement categories", async () => {
  const doc = await documentFor(PrivacyPage);
  const analytics = doc.querySelector("#analytics");
  expect(analytics).toHaveTextContent("14 months");
  expect(analytics).not.toHaveTextContent("either 2 or 14");
  for (const event of [
    "page_view",
    "scroll",
    "click",
    "file_download",
    "first_visit",
    "session_start",
    "user_engagement",
  ])
    expect(analytics).toHaveTextContent(event);
  expect(analytics).toHaveTextContent(
    "Automatic form interactions, site search and video engagement measurement are disabled",
  );
});

it("lists the 13-month analytics cookie lifetime that the tag enforces", async () => {
  const doc = await documentFor(PrivacyPage);
  const cookies = doc.querySelector("#cookies");
  expect(cookies).toHaveTextContent("13 months, renewed on visits");
  expect(cookies).not.toHaveTextContent("2 years");
});
