// Translate what the office typed on an order as soon as it is saved, so the Urdu, Bengali and Hindi are ready (and saved) before the master
// opens the order. Fire and forget: the save never waits for it and never fails because of it. With no translator switched on this does nothing.
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { itemStages } from "@/db/schema";
import { OTHER_LANGS, cleanSource, isTranslatable } from "./i18n";
import { handWritten } from "./langs";
import { getOrder, listItems } from "./orders";
import { MAX_TEXTS, translateTexts, translationEnabled } from "./translate";

/** Every text of the order that the master's screen would ask a translator for, most important first (what was typed, then the names). */
export function textsToTranslate(orderId: number): string[] {
  const order = getOrder(orderId);
  if (!order) return [];
  const items = listItems(orderId);
  const typed: string[] = [order.details];
  const names: string[] = [];
  for (const it of items) {
    for (const v of Object.values(it.values)) if (typeof v === "string") typed.push(v);
    for (const f of it.snapshot.fields) names.push(f.label);
    for (const s of it.snapshot.stages ?? []) names.push(s.label);
  }
  if (items.length > 0) {
    for (const s of db
      .select({ instruction: itemStages.instruction })
      .from(itemStages)
      .where(inArray(itemStages.itemId, items.map((i) => i.id)))
      .all())
      if (s.instruction) typed.push(s.instruction);
  }
  return [...new Set([...typed, ...names].filter(isTranslatable).map(cleanSource))];
}

/** Start translating the order's texts into all three languages in the background. */
export function pretranslateOrder(orderId: number): void {
  if (!translationEnabled()) return;
  void (async () => {
    try {
      const texts = textsToTranslate(orderId);
      for (const lang of OTHER_LANGS) {
        const need = texts.filter((t) => !handWritten(lang, t)); // the hand-written lists already have those
        for (let i = 0; i < need.length; i += MAX_TEXTS) await translateTexts(need.slice(i, i + MAX_TEXTS), lang);
      }
    } catch {
      /* nothing to do: the master's own request will try again */
    }
  })();
}
