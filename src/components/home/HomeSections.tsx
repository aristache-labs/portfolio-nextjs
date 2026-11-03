"use client";

import { lazy, Suspense, type ComponentProps } from "react";

// React lazy keeps server-rendered sections intact without eagerly preloading every section's
// JavaScript through a Server Component's next/dynamic entry, including on unrelated routes.
const LazySkills = lazy(() => import("./Skills").then((module) => ({ default: module.Skills })));
const LazyExperience = lazy(() =>
  import("./Experience").then((module) => ({ default: module.Experience })),
);
const LazyServices = lazy(() =>
  import("./Services").then((module) => ({ default: module.Services })),
);
const LazyContact = lazy(() => import("./Contact").then((module) => ({ default: module.Contact })));

export function Skills(props: ComponentProps<typeof LazySkills>) {
  return (
    <Suspense fallback={null}>
      <LazySkills {...props} />
    </Suspense>
  );
}
export function Experience(props: ComponentProps<typeof LazyExperience>) {
  return (
    <Suspense fallback={null}>
      <LazyExperience {...props} />
    </Suspense>
  );
}
export function Services(props: ComponentProps<typeof LazyServices>) {
  return (
    <Suspense fallback={null}>
      <LazyServices {...props} />
    </Suspense>
  );
}
export function Contact(props: ComponentProps<typeof LazyContact>) {
  return (
    <Suspense fallback={null}>
      <LazyContact {...props} />
    </Suspense>
  );
}
