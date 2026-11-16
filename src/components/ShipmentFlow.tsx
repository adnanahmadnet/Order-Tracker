"use client";

import { useState } from "react";
import { sendShipmentAction } from "@/app/m/actions";
import { Icon } from "./Icon";
import { PhotoUpload } from "./PhotoUpload";

type Choice = { id: number; label: string; sub?: string }; // sub: the customer and design number
export type LockedChoice = Choice & { blockers: string[] };

/** Items that cannot be sent yet, with exactly what is missing for each. */
export function LockedItems({ items }: { items: LockedChoice[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.id} className="panel space-y-1">
          <div className="flex items-center gap-2 text-xl font-medium">
            <Icon name="lock" className="h-5 w-5 shrink-0 text-muted" />
            {i.label}
          </div>
          <p className="text-base text-muted">Not ready to send yet:</p>
          <ul className="list-disc space-y-0.5 ps-5 text-base">
            {i.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/** A step heading: the number in grey, the title, and a short line under it. */
function StepTitle({ n, children, note, hint }: { n: number; children: React.ReactNode; note?: string; hint?: string }) {
  return (
    <div className="space-y-1">
      <h2 className="flex items-center gap-2 text-xl font-medium">
        <span className="text-muted">{n}.</span>
        <span className="flex-1">{children}</span>
        {note && <span className="rounded-full border border-rule-2 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-muted">{note}</span>}
      </h2>
      {hint && <p className="text-base text-muted">{hint}</p>}
    </div>
  );
}

/** A small tag on the right of a checklist row. */
function Tag({ children, on }: { children: React.ReactNode; on?: boolean }) {
  return <span className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${on ? "bg-ok-soft text-ok" : "border border-rule-2 text-muted"}`}>{children}</span>;
}

/**
 * The whole shipment on one page: choose the items, add the bill photo, send.
 * The ticks live in this component, so adding a photo (which refreshes the page) never loses them.
 */
export function ShipmentFlow({
  token,
  orderId,
  shipmentId,
  turnOk,
  ready,
  locked,
  initialPicked,
  billPhotoId,
  packagePhotoId,
  error,
}: {
  token: string;
  orderId: number;
  shipmentId: number | null; // null until a photo is added or Send is pressed
  turnOk: boolean;
  ready: Choice[];
  locked?: LockedChoice[];
  initialPicked: number[];
  billPhotoId: number | null;
  packagePhotoId: number | null;
  error: string | null;
}) {
  const [picked, setPicked] = useState<number[]>(initialPicked);
  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const hasItems = picked.length > 0;
  const canSend = hasItems && turnOk; // the bill photo is optional
  const photoUrl = (id: number) => `/api/m/${token}/photos/${id}`;
  const endpoint = `/api/m/${token}/orders/${orderId}/ship-photos`;
  const mark = (ok: boolean) => <Icon name={ok ? "check" : "alert"} className={`h-5 w-5 shrink-0 ${ok ? "text-leaf" : "text-muted"}`} />;

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-8 lg:order-2">
        {!turnOk && (
          <p role="status" className="rounded-2xl bg-paper-3 p-4 text-lg font-medium">
            You can send this order after the orders above it. You can still get the bill photo ready now.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-2xl bg-thread/10 p-4 text-lg font-medium text-thread">
            {error}
          </p>
        )}

        <section className="space-y-3">
          <StepTitle n={1} hint="Finished items are here. Take out any you are not sending today.">
            Pending shipment
          </StepTitle>
          <ul className="space-y-2">
            {ready.map((i) => {
              const on = picked.includes(i.id);
              return (
                <li key={i.id} className={`flex items-center gap-3 rounded-2xl border-2 p-4 shadow-sm ${on ? "border-ok/50 bg-ok-soft/40" : "border-bad/40 bg-bad-soft/40"}`}>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="break-words text-xl font-medium">{i.label}</span>
                      <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-medium text-ok">Ready</span>
                    </span>
                    {i.sub && <span className="block text-base font-medium text-ink-2" translate="no">{i.sub}</span>}
                    <span className="mt-0.5 flex items-center gap-1.5 text-base text-muted">
                      <Icon name="check" className="h-4 w-4 text-ok" /> I checked it is here
                    </span>
                  </span>
                  {/* an item that is in the shipment has no button here (the red cross is in "Your shipment"); an item that is out has a green tick to put it back */}
                  {!on && (
                    <button
                      type="button"
                      onClick={() => toggle(i.id)}
                      aria-label={`Put ${i.label} in the shipment`}
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-ok bg-ok text-white"
                    >
                      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                      </svg>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <LockedItems items={locked ?? []} />
        </section>
      </div>

      <form action={sendShipmentAction} className="space-y-4 overflow-hidden rounded-3xl border border-rule-2 bg-paper-2 p-5 shadow-sm lg:sticky lg:top-4 lg:order-1">
        <span aria-hidden className="-mx-5 -mt-5 mb-1 block h-1 bg-gradient-to-r from-accent via-accent-deep to-ink" />
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="shipmentId" value={shipmentId ?? ""} />
        {picked.map((id) => (
          <span key={id}>
            <input type="hidden" name="inc" value={id} />
            <input type="hidden" name="chk" value={id} />
          </span>
        ))}
        <h2 className="flex items-center gap-2 text-xl font-medium">
          <Icon name="shipments" className="h-6 w-6 text-muted" />
          <span className="flex-1">Your shipment</span>
          <span className="grid h-7 min-w-7 place-items-center rounded-full border border-rule-2 px-2 text-base">{picked.length}</span>
        </h2>

        {picked.length > 0 && (
          <ul className="space-y-2">
            {ready
              .filter((i) => picked.includes(i.id))
              .map((i) => (
                <li key={i.id} className="flex items-center gap-3 rounded-xl bg-paper-3 px-3 py-2 text-lg">
                  <span className="min-w-0 flex-1 break-words font-medium">
                    {i.label}
                    {i.sub && <span className="block text-sm font-normal text-muted" translate="no">{i.sub}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(i.id)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-bad bg-white text-bad"
                    aria-label={`Take ${i.label} out of the shipment`}
                  >
                    <Icon name="close" className="h-5 w-5" />
                  </button>
                </li>
              ))}
          </ul>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Before you send</p>
          <ul className="space-y-2 text-base">
            <li className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${hasItems ? "border-ok/30 bg-ok-soft/40" : "border-rule-2"}`}>
              {mark(hasItems)} <span className={hasItems ? "" : "text-muted"}>{hasItems ? `${picked.length} item${picked.length === 1 ? "" : "s"} chosen` : "Choose the items"}</span>
              {hasItems && <Tag on>Done</Tag>}
            </li>
            {/* the two photos are optional: a plus on the row adds one (the camera opens); a small picture shows it is there */}
            {[
              { id: billPhotoId, kind: "bill", name: "Bill photo", added: "Bill photo added", alt: "Bill", again: "Take the bill photo again", add: "Take photo of bill" },
              { id: packagePhotoId, kind: "package", name: "Packed items photo", added: "Packed items photo", alt: "Packed items", again: "Take the photo again", add: "Take photo of packed items" },
            ].map((r) => (
              <li key={r.kind} className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 ${r.id !== null ? "border-ok/30 bg-ok-soft/40" : "border-rule-2"}`}>
                {r.id !== null ? (
                  <a href={photoUrl(r.id)} target="_blank" rel="noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${photoUrl(r.id)}?thumb=1`} alt={r.alt} className="h-11 w-11 rounded-lg border object-cover" />
                  </a>
                ) : (
                  <Icon name="photos" className="h-5 w-5 shrink-0 text-muted" />
                )}
                <span className={`min-w-0 flex-1 ${r.id !== null ? "" : "text-muted"}`}>{r.id !== null ? r.added : r.name}</span>
                <Tag on={r.id !== null}>{r.id !== null ? "Attached" : "Optional"}</Tag>
                <PhotoUpload endpoint={endpoint} fields={{ kind: r.kind }} label={r.id !== null ? r.again : r.add} camera iconOnly />
              </li>
            ))}
            {!turnOk && (
              <li className="flex items-center gap-2 rounded-xl border border-rule-2 px-3 py-2.5">
                {mark(false)} Wait for the orders above this one
              </li>
            )}
          </ul>
        </div>

        <button
          disabled={!canSend}
          className="btn h-auto min-h-14 w-full gap-2 rounded-xl border !border-ink !bg-ink px-5 py-3 text-lg !text-white disabled:!border-rule-2 disabled:!bg-paper-3 disabled:!text-muted"
        >
          Send to shipping <Icon name="arrow" className="rtl-flip h-5 w-5" />
        </button>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Icon name="info" className="h-4 w-4 shrink-0" /> The office can see it as soon as you send.
        </p>
      </form>
    </div>
  );
}
