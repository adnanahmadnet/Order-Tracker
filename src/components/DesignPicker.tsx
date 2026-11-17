"use client";

import { useEffect, useRef, useState } from "react";
import { input } from "./ui";

export type DesignOption = { id: number; name: string; photoIds: number[] };

/**
 * The "Design number" box of an item on the customer form: pick one of the designs the office added on the Design
 * Category page (the box suggests them as you click or type), or just type any number. A number from the library copies
 * its pictures onto the item when the form is saved; any other number is kept as typed (and pictures can be added with the +).
 */
export function DesignNumberSelect({
  name,
  value,
  designs,
  label,
  missing,
}: {
  name: string; // form field, "v:<item key>:<field key>"
  value: string;
  designs: DesignOption[];
  label: string;
  missing?: boolean;
}) {
  const [now, setNow] = useState(value);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const chosen = designs.find((d) => d.name.toLowerCase() === now.trim().toLowerCase());
  // close the list when something else is pressed
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);
  return (
    <div ref={box} className="relative">
      <div className="relative">
        <input
          name={name}
          value={now}
          onChange={(e) => {
            setNow(e.target.value);
            setOpen(false); // he is writing his own: get the list out of the way
          }}
          onClick={() => designs.length > 0 && setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Tap to choose, or type"
          autoComplete="off"
          className={`${input} pe-14`}
          aria-label={label}
          aria-invalid={missing || undefined}
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Hide the list of designs" : "Show the list of designs"}
          aria-expanded={open}
          className="absolute inset-y-1 end-1 flex w-11 items-center justify-center rounded-full border-s border-rule bg-paper-3 text-ink hover:bg-accent-soft"
        >
          <svg viewBox="0 0 20 20" className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} fill="currentColor" aria-hidden>
            <path d="M5 7.5 10 13l5-5.5z" />
          </svg>
        </button>
      </div>
      {open && (
        <ul role="listbox" className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-rule bg-paper-2 py-1 shadow-lg">
          {designs.length === 0 && <li className="px-4 py-2 text-base text-muted">No designs in the list yet. Type a number.</li>}
          {designs.map((d) => (
            <li key={d.id} role="option" aria-selected={d.name === now}>
              <button
                type="button"
                onClick={() => {
                  setNow(d.name);
                  setOpen(false);
                }}
                className={`flex min-h-11 w-full items-center px-4 text-start text-base hover:bg-paper-3 ${d.name === now ? "font-medium" : ""}`}
              >
                {d.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {chosen && chosen.photoIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {chosen.photoIds.map((pid) => (
            <a key={pid} href={`/api/admin/designs/${pid}`} target="_blank" rel="noreferrer" className="block h-14 w-14 overflow-hidden rounded-xl border border-rule bg-paper-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/admin/designs/${pid}?thumb=1`} alt={chosen.name} className="h-full w-full object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
