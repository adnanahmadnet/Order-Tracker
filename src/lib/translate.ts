import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { textTranslations } from "@/db/schema";
import { type OtherLang, cleanSource, isTranslatable } from "./i18n";

/**
 * Urdu, Bengali or Hindi for text the office typed (the fixed words of the app are in urdu.ts, bengali.ts and hindi.ts and never come here).
 * Each text is translated once per language with Google Cloud Translation and then kept in the `text_translations` table.
 * Without GOOGLE_TRANSLATE_API_KEY nothing is translated and the master simply sees the English.
 */
export const MAX_TEXTS = 80;

export function translationEnabled(): boolean {
  return !!process.env.GOOGLE_TRANSLATE_API_KEY;
}

/** The service call. One request for many texts. Returns the translation in the same order, or null for a text that failed. */
async function callService(texts: string[], lang: OtherLang): Promise<(string | null)[]> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key || texts.length === 0) return texts.map(() => null);
  try {
    const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ q: texts, source: "en", target: lang, format: "text" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return texts.map(() => null);
    const data = (await res.json()) as { data?: { translations?: { translatedText?: string }[] } };
    const out = data.data?.translations ?? [];
    return texts.map((_, i) => (typeof out[i]?.translatedText === "string" ? out[i].translatedText! : null));
  } catch {
    return texts.map(() => null);
  }
}

/** The translation of each text: from the saved ones, else from the service (then saved). A text that cannot be translated is left out. */
export async function translateTexts(raw: string[], lang: OtherLang): Promise<Record<string, string>> {
  const wanted = [...new Set(raw.filter(isTranslatable).map(cleanSource))].slice(0, MAX_TEXTS);
  if (wanted.length === 0) return {};

  const result: Record<string, string> = {};
  for (const r of db
    .select()
    .from(textTranslations)
    .where(and(eq(textTranslations.lang, lang), inArray(textTranslations.source, wanted)))
    .all())
    result[r.source] = r.translated;

  const missing = wanted.filter((t) => !(t in result));
  if (missing.length > 0) {
    const got = await callService(missing, lang);
    missing.forEach((t, i) => {
      const translated = got[i];
      if (!translated) return;
      result[t] = translated;
      db.insert(textTranslations).values({ lang, source: t, translated }).onConflictDoNothing().run();
    });
  }
  return result;
}
