import nextDynamic from "next/dynamic";
import { Caveat, Sora } from "next/font/google";
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
import { SiteNav } from "@/components/navbar/SiteNav";
import { Footer } from "@/components/layout/Footer";
import { CaveatFontGate } from "@/components/home/CaveatFontGate";
import styles from "./home-performance.module.css";

// ISR: prerendered at build time, so the build needs a reachable database. 12h is a Neon compute
// budget decision, not a freshness one - admin saves publish immediately. See AGENTS.md.
export const revalidate = 43200;

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-hand",
  display: "swap",
  // Only the Contact quote and skills motion use it, both below the fold.
  preload: false,
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
  const show = (id: string) => vis[id] !== false;

  // Fetch only the data for VISIBLE sections - a hidden section runs no query
  // (and its component chunk never loads via the gated dynamic import below).
  // Socials + funding are shared (nav/footer + hero sponsor), so always load.
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
      className={`${styles.page} ${sora.variable} dark bg-background text-foreground relative min-h-screen`}
    >
      <CaveatFontGate className={caveat.variable} />
      <SiteNav
        socials={socials.map((s) => ({ platform: s.platform, url: s.url }))}
        hidden={Object.entries(vis)
          .filter(([, v]) => v === false)
          .map(([k]) => k)}
        sponsorUrl={sponsorUrl}
      />

      <Hero
        profile={{ name: profile.name, roles: profile.roles }}
        heroTagline={profile.heroTagline}
        resumeUrl={profile.resumeUrl}
        socials={socials.map((s) => ({ platform: s.platform, url: s.url }))}
      />

      {show("about") && (
        <About
          profile={{
            bio: profile.bio,
            stats: profile.stats,
            name: profile.name,
            avatarUrl: profile.avatarUrl,
          }}
        />
      )}

      {show("skills") && <Skills skills={skills} />}

      {show("experience") && <Experience experiences={experiences} />}

      {show("projects") && <Projects projects={projects} sponsorUrl={sponsorUrl} />}

      {show("services") && <Services services={services} />}

      {show("contact") && <Contact socials={socials} email={contactEmail} />}

      <Footer socials={socials} email={profile.email} sponsorUrl={sponsorUrl} />
    </div>
  );
}
