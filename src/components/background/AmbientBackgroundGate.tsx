"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const AmbientBackground = dynamic(
  () => import("./AmbientBackground").then((module) => module.AmbientBackground),
  { ssr: false },
);

export function AmbientBackgroundGate() {
  const pathname = usePathname();
  if (pathname === "/" || pathname === "/login" || pathname?.startsWith("/admin")) return null;
  return <AmbientBackground />;
}
