import Link from "next/link";
import { fmtDay } from "./ui";
import { PhotoUpload } from "./PhotoUpload";
import { StepPicture } from "./StepPicture";
import { daysUntil } from "@/lib/colour";
import type { PendingStep } from "@/lib/item-search";

const SHOWN = 6;

/**
 * For a master: what is waiting for him, one card for each order (customer, design number, due date) with a line for each item inside (the step it is at),
 * nearest due date first. When the step takes a photo, "Take photo" opens the camera straight away.
 */
export function PendingWork({ token, steps, all = false }: { token: string; steps: PendingStep[]; all?: boolean }) {
  if (steps.length === 0) return null;
  // one card for each ORDER (its items' steps inside), nearest due date first (the list is already in that order)
  const orders: { orderId: number; first: PendingStep; steps: PendingStep[] }[] = [];
  for (const st of steps) {
    const o = orders.find((x) => x.orderId === st.orderId);
    if (o) o.steps.push(st);
    else orders.push({ orderId: st.orderId, first: st, steps: [st] });
  }
  const late = orders.filter((o) => daysUntil(o.first.karigarDueDate) < 0).length;
  const soon = orders.filter((o) => {
    const d = daysUntil(o.first.karigarDueDate);
    return d >= 0 && d <= 7;
  }).length;
  return (
    <section className="space-y-3" aria-label="My pending work">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {!all && <h2 className="text-2xl font-medium">My pending work</h2>}
        <Link href={`/m/${token}/items?due=7`} className="link text-base font-medium">
          {late > 0 ? `${late} late, ` : ""}
          {soon} due this week
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(all ? orders : orders.slice(0, SHOWN)).map((o) => {
          const s = o.first;
          const left = daysUntil(s.karigarDueDate);
          return (
            <li key={o.orderId} className="panel space-y-2">
              <Link href={`/m/${token}/orders/${o.orderId}`} className="block">
                <p className="text-xl font-medium leading-snug">
                  #{s.orderNumber} - <bdi translate="no">{s.customerName}</bdi>
                </p>
                {s.designNumber ? (
                  <p className="text-base text-muted">
                    Design: <bdi translate="no">{s.designNumber}</bdi>
                  </p>
                ) : null}
                <p className={`text-base font-medium ${left < 0 ? "text-thread" : ""}`}>
                  {left < 0 ? `Late by ${-left} day${left === -1 ? "" : "s"}` : `Due ${fmtDay(s.karigarDueDate)}`}
                </p>
              </Link>
              {!s.confirmed && <p className="text-base text-muted">Open the order and confirm it first.</p>}
              <ul className="space-y-2">
                {o.steps.map((x) => (
                  <li key={x.itemId} className="space-y-2 border-t border-rule-2 pt-2">
                    <Link href={`/m/${token}/orders/${o.orderId}`} className="flex items-center gap-3">
                      <StepPicture label={x.stepLabel} />
                      <p className="min-w-0 flex-1 break-words text-lg font-medium leading-snug">
                        {x.label}: {x.stepLabel}
                      </p>
                    </Link>
                    {x.confirmed && x.photoRule !== "none" && (
                      <PhotoUpload endpoint={`/api/m/${token}/photos`} fields={{ itemId: String(x.itemId), stageKey: x.stepKey }} label="Take photo" camera />
                    )}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      {!all && orders.length > SHOWN && (
        <Link href={`/m/${token}/pending`} className="link inline-flex min-h-12 items-center text-lg font-medium">
          See all {orders.length} pending orders
        </Link>
      )}
    </section>
  );
}
