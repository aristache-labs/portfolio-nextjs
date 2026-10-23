"use client";

import { useState } from "react";
import { usePalette } from "@/hooks/usePalette";
import { PALETTES } from "@/lib/palettes";
import { BRAND } from "@/lib/brand";

const BADGES = {
  contributors: { label: "Contributors", endpoint: "contributors", target: "graphs/contributors" },
  stars: { label: "Stars", endpoint: "stars", target: "stargazers" },
} as const;

function RepoBadge({
  repo,
  metric,
  color,
  logoColor,
}: {
  repo: string;
  metric: keyof typeof BADGES;
  color: string;
  logoColor: string;
}) {
  const [failed, setFailed] = useState(false);
  const { label, endpoint, target } = BADGES[metric];
  const query = new URLSearchParams({
    style: "flat",
    logo: "github",
    logoColor,
    labelColor: "10181a",
    label,
    color,
  });
  const repoPath = `aristache-labs/${encodeURIComponent(repo)}`;
  const badgePath = `${endpoint}/${repoPath}`;
  return (
    <a
      href={`https://github.com/${repoPath}/${target}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`GitHub ${metric} for ${repo}`}
      className="focus-visible:ring-brand-mid/70 inline-flex min-h-7 items-center rounded-md transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:outline-none"
    >
      {failed ? (
        <span className="border-border text-muted rounded-md border px-2 py-1 text-xs">
          {label}
        </span>
      ) : (
        // Shields badges have variable widths and are served directly as SVGs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://img.shields.io/github/${badgePath}?${query}`}
          alt={`GitHub ${metric}`}
          height={22}
          className="h-[22px] w-auto rounded-md"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </a>
  );
}

export function ProjectRepoBadges({ repo }: { repo: string }) {
  const { palette } = usePalette();
  const ramp = PALETTES.find((p) => p.id === palette)?.ramp ?? [
    BRAND.deep,
    BRAND.mid,
    BRAND.bright,
  ];
  return (
    <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
      {(["contributors", "stars"] as const).map((metric) => (
        <RepoBadge
          key={`${repo}-${metric}-${palette}`}
          repo={repo}
          metric={metric}
          color={ramp[0].slice(1)}
          logoColor={ramp[2].slice(1)}
        />
      ))}
    </div>
  );
}
