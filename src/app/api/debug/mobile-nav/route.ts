import { z } from "zod";

const entry = z.object({
  event: z.enum([
    "ready",
    "menu-toggle",
    "menu-state",
    "section-select",
    "scroll-start",
    "scroll-sample",
    "error",
    "rejection",
    "pagehide",
    "pageshow",
    "visibility",
    "resize",
  ]),
  section: z.string().max(40),
  message: z.string().max(300),
  time: z.number().finite(),
  scrollY: z.number().finite(),
  width: z.number().finite(),
  height: z.number().finite(),
  visualHeight: z.number().finite(),
  pageHeight: z.number().finite(),
  videos: z.number().int().nonnegative(),
  playing: z.number().int().nonnegative(),
  menuOpen: z.boolean(),
  bodyOverflow: z.string().max(30),
  hidden: z.boolean(),
  backdropFilter: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") return new Response(null, { status: 404 });
  try {
    const body = await request.text();
    if (body.length > 4096) return new Response(null, { status: 413 });
    const result = entry.safeParse(JSON.parse(body));
    if (!result.success) return new Response(null, { status: 400 });
    console.info("[mobile-nav-debug]", JSON.stringify(result.data));
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
