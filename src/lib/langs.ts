import { bengaliFor } from "./bengali";
import { hindiFor } from "./hindi";
import type { Lang } from "./i18n";
import { urduFor } from "./urdu";

/** The master's languages: how each is shown. English is the page as it is. */
export const LANGS: { code: Lang; label: string; dir: "ltr" | "rtl"; font: string }[] = [
  { code: "en", label: "English", dir: "ltr", font: "" },
  { code: "ur", label: "اردو", dir: "rtl", font: "urdu-font" },
  { code: "bn", label: "বাংলা", dir: "ltr", font: "bengali-font" },
  { code: "hi", label: "हिन्दी", dir: "ltr", font: "hindi-font" },
];

/** The text in that language from the hand-written list, or null. */
export function handWritten(lang: Lang, text: string): string | null {
  return lang === "ur" ? urduFor(text) : lang === "bn" ? bengaliFor(text) : lang === "hi" ? hindiFor(text) : null;
}
