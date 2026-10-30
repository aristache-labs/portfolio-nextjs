import nextDynamic from "next/dynamic";
import { Sora } from "next/font/google";
import {
  getProfile,
  getProjectsMerged,
  getExperiences,
  getSkills,
  getServices,
  getSocialLinks,
  getFundingLinks,
} from "@/lib/queries";
import { Hero } from "@/components/home/Hero";
import { SkipLink } from "@/components/navbar/SkipLink";
import { SiteNav } from "@/components/navbar/SiteNav";
import { Footer } from "@/components/layout/Footer";
import { sectionNumbers } from "@/lib/section-numbers";

// ISR: prerendered at build time, so the build needs a reachable database. 12h is a Neon compute
// budget decision, not a freshness one - admin saves publish immediately. See AGENTS.md.
export const revalidate = 43200;

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

// Below-the-fold sections: lazy-loaded to keep the hero bundle lean.
// Note: These are Server Components — next/dynamic with ssr:true (default)
// performs code-splitting without disabling server rendering.
const About = nextDynamic(() =>
  import("@/components/home/About").then((m) => ({ default: m.About })),
);
const Skills = nextDynamic(() =>
  import("@/components/home/Skills").then((m) => ({ default: m.Skills })),
);
const Experience = nextDynamic(() =>
  import("@/components/home/Experience").then((m) => ({ default: m.Experience })),
);
const Projects = nextDynamic(() =>
  import("@/components/home/Projects").then((m) => ({ default: m.Projects })),
);
const Services = nextDynamic(() =>
  import("@/components/home/Services").then((m) => ({ default: m.Services })),
);
const Contact = nextDynamic(() =>
  import("@/components/home/Contact").then((m) => ({ default: m.Contact })),
);
export default async function Home() {
  // Profile gates everything and feeds the always-on Hero, so it loads first.
  // A section is visible unless its key is explicitly false.
  const profile = await getProfile();
  const vis = profile.sectionVisibility;
  const numbers = sectionNumbers(vis);
  const show = (id: string) => vis[id] !== false;

  // Fetch only the data for VISIBLE sections - a hidden section runs no query
  // (and its component chunk never loads via the gated dynamic import below).
  // Socials and the optional footer support link are shared, so always load.
  const [projects, experiences, skills, services, socials, funding] = await Promise.all([
    show("projects") ? getProjectsMerged() : Promise.resolve([]),
    show("experience") ? getExperiences() : Promise.resolve([]),
    show("skills") ? getSkills() : Promise.resolve([]),
    show("services") ? getServices() : Promise.resolve([]),
    getSocialLinks(),
    getFundingLinks(),
  ]);

  const sponsorUrl = funding.find((f) => f.primary)?.url;
  const contactEmail = profile.email ?? "";

  return (
    <div
      data-site="cinematic"
      className={`${sora.variable} dark bg-background text-foreground relative min-h-screen`}
    >
      <SkipLink />
      <SiteNav
        socials={socials.map((s) => ({ platform: s.platform, url: s.url }))}
        hidden={Object.entries(vis)
          .filter(([, v]) => v === false)
          .map(([k]) => k)}
      />
      <div id="page-content" tabIndex={-1} className="scroll-mt-24 outline-none" />

      <Hero
        profile={{ name: profile.name, roles: profile.roles }}
        heroTagline={profile.heroTagline}
        resumeUrl={profile.resumeUrl}
        socials={socials.map((s) => ({ platform: s.platform, url: s.url }))}
      />

      {show("about") && (
        <About
          number={numbers.about}
          profile={{
            bio: profile.bio,
            stats: profile.stats,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
          }}
        />
      )}

      {show("skills") && <Skills skills={skills} number={numbers.skills} />}

      {show("experience") && <Experience experiences={experiences} number={numbers.experience} />}

      {show("projects") && <Projects projects={projects} number={numbers.projects} />}

      {show("services") && <Services services={services} number={numbers.services} />}

      {show("contact") && (
        <Contact socials={socials} email={contactEmail} number={numbers.contact} />
      )}

      <Footer
        socials={socials}
        email={profile.email}
        heroTagline={profile.heroTagline}
        sponsorUrl={sponsorUrl}
        sectionVisibility={vis}
      />
    </div>
  );
}
