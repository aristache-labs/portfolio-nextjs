import portraitCss from "@/components/ui/portrait-card-surface.module.css";

export const COMPACT_PROJECT_ACTION = "px-2.5 py-1.5 text-xs [&_svg]:size-3";

export const COMPACT_PROJECT_TAGS =
  "[&>span]:px-1.5 [&>span]:py-0.5 [&>span]:text-[10px] [&>span]:leading-tight";

/** Light glass, as on the Skills and Experience cards. */
export const GLASS_CARD = `${portraitCss.surface} border-white/8 bg-[linear-gradient(180deg,rgb(255_255_255/0.045),rgb(255_255_255/0.01))] backdrop-blur-[18px]`;
