"use client";

import dynamic from "next/dynamic";
import { useHydratedPathname } from "@/hooks/useHydratedPathname";

const AmbientBackground = dynamic(
  () => import("./AmbientBackground").then((module) => module.AmbientBackground),
  { ssr: false },
);

export function AmbientBackgroundGate() {
  const pathname = useHydratedPathname();
  if (!pathname || pathname === "/" || pathname === "/login" || pathname.startsWith("/admin"))
    return null;
  return <AmbientBackground />;
}
