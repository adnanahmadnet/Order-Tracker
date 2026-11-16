"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { cleanSource, isTranslatable, urduFor } from "@/lib/urdu";

/**
 * The English / اردو button of the master's screens, and the Urdu itself.
 * When Urdu is on, every text inside the page is swapped for Urdu: first from the hand-written list (urdu.ts), then, for text
 * the office typed, from the translation route (saved on the server). The screen turns right-to-left. Anything inside an element
 * with translate="no" (customer names, design numbers) is left as it is. The choice is remembered on that phone.
 * The printed sheet (/print) is never translated. Without Urdu nothing here runs.
 */
const KEY = "master-lang";
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT", "SVG", "CODE"]);

function skipped(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName.toUpperCase())) return true;
    if (e.getAttribute("translate") === "no") return true;
  }
  return false;
}

const LANG_EVENT = "master-lang-change";

function subscribeLang(cb: () => void) {
  window.addEventListener(LANG_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(LANG_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

function readLang(): "en" | "ur" {
  try {
    return localStorage.getItem(KEY) === "ur" ? "ur" : "en";
  } catch {
    return "en";
  }
}

type AttrRec = { en: string; ur: string };

/** Back to English: put every changed text and attribute back as it was. */
function putBack(nodes: Set<Text>, original: WeakMap<Text, string>, shown: WeakMap<Text, string>, attrs: Map<Element, Map<string, AttrRec>>) {
  for (const node of nodes) {
    const en = original.get(node);
    if (node.isConnected && en !== undefined && node.data === shown.get(node)) node.data = en;
  }
  nodes.clear();
  for (const [e, map] of attrs) for (const [a, rec] of map) if (e.isConnected && e.getAttribute(a) === rec.ur) e.setAttribute(a, rec.en);
  attrs.clear();
}

export default function UrduLayer({ token, children }: { token: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const printing = pathname.endsWith("/print");
  const lang = useSyncExternalStore(subscribeLang, readLang, () => "en" as const);
  const root = useRef<HTMLDivElement>(null);

  const choose = (l: "en" | "ur") => {
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* private window: not saved */
    }
    window.dispatchEvent(new Event(LANG_EVENT));
  };

  const on = lang === "ur" && !printing;

  const touched = useRef(new Set<Text>());
  const touchedAttrs = useRef(new Map<Element, Map<string, AttrRec>>());
  const original = useRef(new WeakMap<Text, string>());
  const shown = useRef(new WeakMap<Text, string>());
  const waiting = useRef(new Map<string, Set<Text | { el: Element; attr: string }>>());
  const known = useRef(new Map<string, string>()); // texts already answered by the server this visit
  const tried = useRef(new Set<string>()); // texts the server could not translate: do not ask again
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setText = useCallback((node: Text, ur: string) => {
    shown.current.set(node, ur);
    node.data = ur;
  }, []);

  const ask = useCallback(
    (token_: string) => {
      const texts = [...waiting.current.keys()];
      if (texts.length === 0) return;
      const batch = new Map(waiting.current);
      waiting.current.clear();
      fetch(`/api/m/${token_}/translate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texts }) })
        .then((r) => (r.ok ? r.json() : { ur: {} }))
        .then((j: { ur?: Record<string, string> }) => {
          for (const [src, targets] of batch) {
            const ur = j.ur?.[src];
            if (!ur) {
              tried.current.add(src);
              continue;
            }
            known.current.set(src, ur);
            for (const t of targets) {
              if (t instanceof Text) {
                if (t.isConnected && t.data === original.current.get(t)) setText(t, t.data.replace(t.data.trim(), ur));
              } else if (t.el.isConnected) {
                const rec = touchedAttrs.current.get(t.el)?.get(t.attr);
                if (rec && t.el.getAttribute(t.attr) === rec.en) {
                  rec.ur = ur;
                  t.el.setAttribute(t.attr, ur);
                }
              }
            }
          }
        })
        .catch(() => {
          for (const k of batch.keys()) tried.current.add(k);
        });
    },
    [setText],
  );

  const queue = useCallback(
    (src: string, target: Text | { el: Element; attr: string }) => {
      const set = waiting.current.get(src) ?? new Set();
      set.add(target);
      waiting.current.set(src, set);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => ask(token), 200);
    },
    [ask, token],
  );

  const doText = useCallback(
    (node: Text) => {
      if (shown.current.get(node) === node.data) return; // our own Urdu
      if (skipped(node.parentElement)) return;
      const en = node.data;
      if (!isTranslatable(en)) return;
      original.current.set(node, en);
      const hand = urduFor(en);
      if (hand) {
        touched.current.add(node);
        setText(node, hand);
        return;
      }
      const src = cleanSource(en);
      const cached = known.current.get(src);
      if (cached) {
        touched.current.add(node);
        setText(node, en.replace(en.trim(), cached));
      } else if (!tried.current.has(src)) {
        touched.current.add(node);
        queue(src, node);
      }
    },
    [queue, setText],
  );

  const doAttrs = useCallback(
    (el: Element) => {
      if (skipped(el)) return;
      for (const attr of ATTRS) {
        const en = el.getAttribute(attr);
        if (!en || !isTranslatable(en)) continue;
        const rec = touchedAttrs.current.get(el)?.get(attr);
        if (rec && rec.ur === en) continue; // our own Urdu
        const hand = urduFor(en);
        const src = cleanSource(en);
        const ur = hand ?? known.current.get(src) ?? null;
        const m = touchedAttrs.current.get(el) ?? new Map();
        m.set(attr, { en, ur: ur ?? en });
        touchedAttrs.current.set(el, m);
        if (ur) el.setAttribute(attr, ur);
        else if (!tried.current.has(src)) queue(src, { el, attr });
      }
    },
    [queue],
  );

  const walk = useCallback(
    (top: Node) => {
      if (top instanceof Text) return doText(top);
      if (!(top instanceof Element)) return;
      const tw = document.createTreeWalker(top, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) doText(n as Text);
      doAttrs(top);
      top.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(",")).forEach(doAttrs);
    },
    [doText, doAttrs],
  );

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!on) {
      putBack(touched.current, original.current, shown.current, touchedAttrs.current);
      waiting.current.clear();
      return;
    }
    walk(el);
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "characterData") walk(m.target);
        else if (m.type === "attributes") doAttrs(m.target as Element);
        else m.addedNodes.forEach((n) => walk(n));
      }
    });
    obs.observe(el, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    return () => obs.disconnect();
  }, [on, walk, doAttrs, pathname]);

  return (
    <>
      {!printing && (
        <div className="mb-3 flex justify-end print:hidden" translate="no">
          <div role="group" aria-label="Language" className="inline-flex overflow-hidden rounded-full border border-rule-2 bg-paper-2 text-base shadow-sm">
            <button type="button" onClick={() => choose("en")} aria-pressed={lang === "en"} className={`min-h-11 px-4 ${lang === "en" ? "bg-ink font-medium text-white" : "text-ink"}`}>
              English
            </button>
            <button type="button" onClick={() => choose("ur")} aria-pressed={lang === "ur"} lang="ur" className={`urdu-font min-h-11 px-4 ${lang === "ur" ? "bg-ink font-medium text-white" : "text-ink"}`}>
              اردو
            </button>
          </div>
        </div>
      )}
      <div ref={root} dir={on ? "rtl" : undefined} lang={on ? "ur" : undefined} className={on ? "urdu-font" : undefined}>
        {children}
      </div>
    </>
  );
}
