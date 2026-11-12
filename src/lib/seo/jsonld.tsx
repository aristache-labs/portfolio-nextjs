import { SITE } from "./site";

const PERSON_ID = new URL("/#person", SITE.url).toString();

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

export function PersonJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": PERSON_ID,
        name: SITE.name,
        givenName: SITE.givenName,
        familyName: SITE.familyName,
        alternateName: SITE.personAlternateNames,
        url: new URL("/", SITE.url).toString(),
        image: new URL("/opengraph-image", SITE.url).toString(),
        jobTitle: SITE.jobTitle,
        description: SITE.description,
        sameAs: SITE.sameAs,
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": new URL("/#website", SITE.url).toString(),
        name: SITE.name,
        alternateName: SITE.siteAlternateNames,
        url: new URL("/", SITE.url).toString(),
        publisher: { "@id": PERSON_ID },
      }}
    />
  );
}

type ProjectLike = {
  title: string;
  description: string | null;
  htmlUrl: string | null;
  homepage: string | null;
  language: string | null;
};

/**
 * Homepage-only graph: a ProfilePage about the Person declared in the root layout, the skills
 * as `knowsAbout`, and the visible projects as an ItemList of SoftwareSourceCode. Everything is
 * read from the same admin-managed rows the page renders, so it cannot drift from the content.
 */
export function HomeJsonLd({
  projects,
  skills,
}: {
  projects: ProjectLike[];
  skills: { name: string }[];
}) {
  const home = new URL("/", SITE.url).toString();
  const knowsAbout = [...new Set(skills.map((s) => s.name.trim()).filter(Boolean))];
  const items = projects
    .filter((p) => p.htmlUrl)
    .map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareSourceCode",
        name: p.title,
        ...(p.description ? { description: p.description } : {}),
        codeRepository: p.htmlUrl,
        ...(p.homepage ? { url: p.homepage } : {}),
        ...(p.language ? { programmingLanguage: p.language } : {}),
        author: { "@id": PERSON_ID },
      },
    }));
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          url: home,
          name: SITE.title,
          mainEntity: {
            "@id": PERSON_ID,
            ...(knowsAbout.length > 0 ? { knowsAbout } : {}),
          },
        }}
      />
      {items.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `Projects by ${SITE.name}`,
            itemListElement: items,
          }}
        />
      )}
    </>
  );
}
