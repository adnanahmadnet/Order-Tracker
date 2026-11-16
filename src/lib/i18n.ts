// The shared part of the master's languages (Urdu in urdu.ts, Bengali in bengali.ts, Hindi in hindi.ts). Pure functions, used by the browser
// (LanguageLayer) and by the translate route. A language is a "pack": a hand-written list of words plus a few sentence shapes.
// A number inside a sentence is written as {n}: "3 items" is looked up as "{n} items". {1}, {2}... in the other language
// take the 1st, 2nd number of the English, because the word order can differ.

export type Lang = "en" | "ur" | "bn" | "hi";
export type OtherLang = Exclude<Lang, "en">;
export const OTHER_LANGS: OtherLang[] = ["ur", "bn", "hi"];
export const isOtherLang = (x: unknown): x is OtherLang => OTHER_LANGS.includes(x as OtherLang);

/** How the history lines of one language are put together ("Naseem finished Cutting (Sherwani)"). `of` is the item, if any. */
export type HistoryWords = {
  confirmed: (who: string) => string;
  remade: (who: string, item: string) => string;
  sent: (who: string, item: string) => string;
  done: (who: string, stage: string, of: string) => string;
  note: (who: string, stage: string, of: string) => string;
  instruction: (who: string, stage: string, of: string) => string;
  image: (who: string, stage: string, of: string) => string;
};

export type Pack = {
  dict: Record<string, string>;
  months: Record<string, string>; // January ... December
  joiner: string; // between the parts of "Sherwani, Pants"
  design: (dash: string, rest: string) => string; // "Design: 22"
  history: HistoryWords;
};

/** Texts that never go to translation: numbers, codes, links, nothing with two letters in a row. */
export function isTranslatable(s: string): boolean {
  const t = s.trim();
  if (t.length < 2 || t.length > 500) return false;
  if (!/[A-Za-z]{2}/.test(t)) return false;
  if (/^https?:\/\//i.test(t) || /^[\w.+-]+@[\w-]+\.[\w.]+$/.test(t)) return false;
  return true;
}

/** One text the way it is sent to the service and saved: spaces tidied. */
export function cleanSource(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function fillNumbers(tpl: string, nums: string[]): string {
  let i = 0;
  return tpl.replace(/\{(n|\d)\}/g, (_m, k: string) => (k === "n" ? nums[i++] : nums[Number(k) - 1]) ?? "");
}

const WHO = "(The office|The master|[A-Z]\\S+(?: [A-Z]\\S+)?)";
const OF = "(?: \\((.+)\\))?$";
const H = {
  confirmed: new RegExp(`^${WHO} confirmed they have seen the order$`),
  remade: new RegExp(`^${WHO} sent (.+) back for a remake$`),
  sent: new RegExp(`^${WHO} sent (.+)$`),
  done: new RegExp(`^${WHO} finished (.+?)${OF}`),
  note: new RegExp(`^${WHO} added a note on (.+?)${OF}`),
  instruction: new RegExp(`^${WHO} left an instruction for (.+?)${OF}`),
  image: new RegExp(`^${WHO} added an image to (.+?)${OF}`),
};

/** A translator for one language: the text in that language from the hand-written list, or null when it is not there. Spaces around it are kept. */
export function makeTranslator(pack: Pack): (text: string) => string | null {
  const lower: Record<string, string> = Object.fromEntries(Object.entries(pack.dict).map(([k, v]) => [k.toLowerCase(), v]));
  const short: Record<string, string> = Object.fromEntries(Object.entries(pack.months).map(([en, loc]) => [en.slice(0, 3), loc]));
  const names = Object.keys(pack.months);
  const dateAny = new RegExp("(\\d{1,2}) (" + [...names, ...Object.keys(short)].join("|") + ")(?: (\\d{4}))?", "g");
  const monthYear = new RegExp("^(" + names.join("|") + ") (\\d{4})$");

  function core(text: string): string | null {
    const my = monthYear.exec(text);
    if (my) return `${pack.months[my[1]]} ${my[2]}`;

    // dates ("12 November", "12 November 2026") are set aside as {d}, then numbers as {n}
    const dates: string[] = [];
    const noDates = text.replace(dateAny, (_m, d: string, mo: string, y?: string) => {
      dates.push(`${d} ${pack.months[mo] ?? short[mo]}${y ? ` ${y}` : ""}`);
      return "{d}";
    });
    if (noDates === "{d}") return dates[0];
    const nums = noDates.match(/\d+/g) ?? [];
    const key = noDates.replace(/\d+/g, "{n}");
    const hit = pack.dict[key] ?? pack.dict[text] ?? lower[key.toLowerCase()];
    if (hit) {
      let j = 0;
      return fillNumbers(hit, nums).replace(/\{d\}/g, () => dates[j++] ?? "");
    }

    // "Design: ABC" keeps the number as it is
    const design = /^(- )?Design: (.+)$/.exec(text);
    if (design) return pack.design(design[1] ?? "", design[2]);

    // the history lines: the names stay as they are, the words around them are in the language
    const part = (x: string) => core(x) ?? x;
    const w = pack.history;
    let m: RegExpExecArray | null;
    if ((m = H.confirmed.exec(text))) return w.confirmed(part(m[1]));
    if ((m = H.remade.exec(text))) return w.remade(part(m[1]), part(m[2]));
    if ((m = H.sent.exec(text))) return w.sent(part(m[1]), part(m[2]));
    if ((m = H.done.exec(text))) return w.done(part(m[1]), part(m[2]), m[3] ? part(m[3]) : "");
    if ((m = H.note.exec(text))) return w.note(part(m[1]), part(m[2]), m[3] ? part(m[3]) : "");
    if ((m = H.instruction.exec(text))) return w.instruction(part(m[1]), part(m[2]), m[3] ? part(m[3]) : "");
    if ((m = H.image.exec(text))) return w.image(part(m[1]), part(m[2]), m[3] ? part(m[3]) : "");

    // ": Cutting" after "To make"
    const colon = /^: (.+)$/.exec(text);
    if (colon) return `: ${core(colon[1]) ?? colon[1]}`;
    // a label with a colon: "Chest:"
    const label = /^(.+):$/.exec(text);
    if (label) {
      const inner = core(label[1]);
      if (inner) return `${inner}:`;
    }
    // "Sherwani, Pants": every part must be known
    if (text.includes(", ")) {
      const parts = text.split(", ").map((p) => core(p));
      if (parts.every((p) => p)) return parts.join(pack.joiner);
    }
    return null;
  }

  return (text: string) => {
    const lead = /^\s*/.exec(text)![0];
    const trail = /\s*$/.exec(text)![0];
    const c = text.trim().replace(/\s+/g, " ");
    if (!c) return null;
    const hit = core(c);
    return hit ? lead + hit + trail : null;
  };
}
