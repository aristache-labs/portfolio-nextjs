export function SkipLink() {
  return (
    <a
      href="#page-content"
      className="bg-background text-foreground focus:outline-brand-mid sr-only fixed top-3 left-3 z-[100] rounded-lg px-4 py-3 focus:not-sr-only focus:outline-2"
    >
      Skip to content
    </a>
  );
}
