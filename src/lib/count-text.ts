/** Splits "1,600+" into its prefix, number and suffix, or returns null when there is no number. */
export function parseCountText(text: string) {
  const match = /^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(text.trim());
  if (!match) return null;
  const [, prefix = "", digits = "", suffix = ""] = match;
  return {
    prefix,
    value: Number(digits.replace(/,/g, "")),
    decimals: digits.split(".")[1]?.length ?? 0,
    grouped: digits.includes(","),
    suffix,
  };
}
