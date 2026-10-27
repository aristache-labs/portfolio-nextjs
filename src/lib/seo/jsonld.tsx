import { SITE } from "./site";

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
        name: SITE.name,
        alternateName: SITE.alternateNames,
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
        name: SITE.name,
        alternateName: SITE.alternateNames,
        url: new URL("/", SITE.url).toString(),
      }}
    />
  );
}
