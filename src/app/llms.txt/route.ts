import { SITE } from "@/lib/seo/site";

export const dynamic = "force-static";

export function GET() {
  // llmstxt.org order: H1, blockquote, prose with no headings, then H2 file lists.
  // Each H2 item is a markdown link, optionally followed by ": notes".
  const optional = SITE.sameAs
    .map((url) => `- [GitHub](${url}): Public repositories for aristache-labs`)
    .join("\n");

  const body = `# ${SITE.name}

> ${SITE.description}

Personal site for Cristache Adrian (aristache-labs), an IT technician and mobile and web developer. Start with the Profile links. Skip Optional when a shorter context is enough.

## Profile

- [Full profile](${SITE.url}/llms-full.txt): Experience, projects, skills, and contact in one document
- [Portfolio](${SITE.url}): Public homepage

## Optional

${optional}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
