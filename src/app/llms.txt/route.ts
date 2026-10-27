import { SITE } from "@/lib/seo/site";

export const dynamic = "force-static";

export function GET() {
  // llmstxt.org order: H1, blockquote, prose with no headings, then H2 file lists.
  // Each H2 item is a markdown link, optionally followed by ": notes".
  const optional = [
    `- [GitHub](${SITE.sameAs[0]}): Public repositories for aristache-labs`,
    `- [LinkedIn](${SITE.sameAs[1]}): Professional profile for ${SITE.name}`,
  ].join("\n");

  const body = `# ${SITE.name}

> ${SITE.description}

Personal site for ${SITE.name} (aristache-labs). ${SITE.positioning}. Start with the Profile links. Skip Optional when a shorter context is enough.

## Profile

- [Full profile](${new URL("/llms-full.txt", SITE.url)}): Experience, projects, skills, and contact in one document
- [Portfolio](${new URL("/", SITE.url)}): Public homepage

## Optional

${optional}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
