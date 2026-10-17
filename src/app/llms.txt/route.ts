import { SITE } from "@/lib/seo/site";

export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE.name}

> ${SITE.description}

## Identity

- Name: Cristache Adrian (aristache-labs)
- Role: IT Technician, Mobile and Web Developer

## Links

${SITE.sameAs.map((u) => `- ${u}`).join("\n")}
- ${SITE.url}

See ${SITE.url}/llms-full.txt for the full profile.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
