// Free translation that runs on this computer, no key and nothing sent to anyone. Used when LOCAL_TRANSLATE=1 and there is no Google key.
// The model is Meta's NLLB-200 (distilled, 600M, shrunk to 8 bits) run with transformers.js. The first use downloads it (about 600 MB, once, into
// data/models) and loads it (a minute or two); after that a sentence takes some seconds, which is why every answer is saved by translate.ts.
import path from "node:path";
import type { OtherLang } from "./i18n";

const MODEL = "Xenova/nllb-200-distilled-600M";
const CODES: Record<OtherLang, string> = { ur: "urd_Arab", bn: "ben_Beng", hi: "hin_Deva" };

export const localTranslationEnabled = () => process.env.LOCAL_TRANSLATE === "1";

type Translator = (text: string, opts: Record<string, unknown>) => Promise<{ translation_text: string }[]>;
let loading: Promise<Translator> | null = null;

function load(): Promise<Translator> {
  loading ??= (async () => {
    const { pipeline, env } = await import("@huggingface/transformers");
    env.cacheDir = path.join(process.cwd(), "data", "models");
    return (await pipeline("translation", MODEL, { dtype: "q8" })) as unknown as Translator;
  })().catch((e) => {
    loading = null; // try again next time (for example the download was cut)
    throw e;
  });
  return loading;
}

/** One at a time: the model is big, two sentences together would only share the same processor. */
let chain: Promise<unknown> = Promise.resolve();
const oneAtATime = <T>(fn: () => Promise<T>): Promise<T> => {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
};

/** A text in pieces the model does well with: each line, and each sentence of a line. Returns the pieces with what separated them. */
export function pieces(text: string): { part: string; sep: string }[] {
  const out: { part: string; sep: string }[] = [];
  const lines = text.split("\n");
  lines.forEach((line, li) => {
    const sentences = line.split(/(?<=[.!?])\s+/).filter((s) => s.trim());
    sentences.forEach((s, si) => out.push({ part: s.trim(), sep: si < sentences.length - 1 ? " " : li < lines.length - 1 ? "\n" : "" }));
  });
  return out;
}

/** The text in Urdu, Bengali or Hindi, or null when the model could not be loaded or failed. */
export function localTranslate(text: string, lang: OtherLang): Promise<string | null> {
  return oneAtATime(async () => {
    try {
      const tr = await load();
      let out = "";
      for (const { part, sep } of pieces(text)) {
        if (!/[A-Za-z]/.test(part)) {
          out += part + sep; // numbers and marks stay as they are
          continue;
        }
        const res = await tr(part, { src_lang: "eng_Latn", tgt_lang: CODES[lang], max_new_tokens: Math.min(400, 40 + part.length * 3) });
        const t = res[0]?.translation_text?.trim();
        if (!t) return null;
        out += t + sep;
      }
      return out.trim() || null;
    } catch {
      return null;
    }
  });
}
