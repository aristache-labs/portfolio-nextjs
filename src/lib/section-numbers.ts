const SECTION_ORDER = ["about", "skills", "experience", "projects", "services", "contact"] as const;

/** Missing visibility settings mean enabled, matching the homepage query gates. */
export function sectionNumbers(visibility: Record<string, boolean>) {
  const numbers: Partial<Record<(typeof SECTION_ORDER)[number], string>> = {};
  let index = 1;
  for (const id of SECTION_ORDER) {
    if (visibility[id] === false) continue;
    numbers[id] = String(index++).padStart(2, "0");
  }
  return numbers;
}
