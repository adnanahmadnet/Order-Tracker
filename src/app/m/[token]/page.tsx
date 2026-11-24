import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PinForm } from "@/components/PinForm";
import { StageTrack } from "@/components/StageTrack";
import { PositionTile, TitleIcon, card, chipAttention, fmtDay } from "@/components/ui";
import { BAND_CLASS, BAND_LABEL } from "@/lib/colour";
import { linkState, requireMaster } from "@/lib/master-session";
import { masterDashboard } from "@/lib/orders";
import { itemStatesOfOrder, itemStatesSummary, pendingWork } from "@/lib/item-search";
import { cartCandidates } from "@/lib/shipping";

/** The Finished tile is hidden for now (client, 17 Nov 2026: "not needed yet"). The page /m/[token]/finished still exists. */
const SHOW_FINISHED = false;

export default async function MasterHome({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { token } = await params;
  const { e } = await searchParams;

  const state = await linkState(token);
  if (state === "invalid") return <p className="text-xl">This link is not valid. Ask the office for a new link.</p>;
  if (state === "need-pin") return <PinForm token={token} error={e} />;

  const master = (await requireMaster(token))!;
  const { active } = masterDashboard(master.id);
  const pending = pendingWork(master.id);
  const pendingOrders = new Set(pending.map((p) => p.orderId)).size; // the badge counts orders, not items
  // when some items of an order are finished and others are not, say what is left (for example "1 of 2 items finished. 1 left to make.")
  const sayLeft = (orderId: number) => {
    const st = itemStatesOfOrder(orderId);
    const done = st.filter((x) => x.state !== "making").length;
    return st.length > 1 && done > 0 && done < st.length ? itemStatesSummary(st) : "";
  };
  const leftText = new Map(active.map((o) => [o.id, sayLeft(o.id)]));
  const left = (orderId: number) => leftText.get(orderId) ?? "";
  const ready = cartCandidates(master.id).length; // finished items waiting to be sent

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-3">
          <TitleIcon name="masters" large />
          <h1 className="page-title text-4xl">Hello <bdi translate="no">{master.name}</bdi></h1>
        </div>
        <p className="text-lg">{active.length === 0 ? "No orders right now." : "Open an order to work on it. Any order can be done first."}</p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:max-w-2xl md:gap-3">
        <Link href={`/m/${token}/items`} className="relative flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border border-rule-2 bg-paper-2 p-3 text-center text-muted hover:bg-paper-3">
          <Icon name="hanger" className="h-12 w-12 text-accent-deep" />
          <span className="text-sm font-medium leading-tight text-ink-2">Items</span>
        </Link>
        <Link href={`/m/${token}/pending`} className="relative flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border border-rule-2 bg-paper-2 p-3 text-center text-muted hover:bg-paper-3">
          <Icon name="clock" className="h-12 w-12 text-accent-deep" />
          {pendingOrders > 0 && <span className="absolute end-2 top-2 rounded-full bg-accent px-2.5 py-0.5 text-base text-white">{pendingOrders}</span>}
          <span className="text-sm font-medium leading-tight text-ink-2">My pending work</span>
        </Link>
        <Link href={`/m/${token}/cart`} className="relative flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border border-rule-2 bg-paper-2 p-3 text-center text-muted hover:bg-paper-3">
          <Icon name="shipments" className="h-12 w-12 text-accent-deep" />
          {ready > 0 && <span className="absolute end-2 top-2 rounded-full bg-accent px-2.5 py-0.5 text-base text-white">{ready}</span>}
          <span className="text-sm font-medium leading-tight text-ink-2">Cart</span>
        </Link>
        {SHOW_FINISHED && (
          <Link href={`/m/${token}/finished`} className="relative flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border border-rule-2 bg-paper-2 p-3 text-center text-muted hover:bg-paper-3">
            <Icon name="check" className="h-12 w-12 text-ok" />
            <span className="text-sm font-medium leading-tight text-ink-2">Finished</span>
          </Link>
        )}
        <Link href={`/m/${token}/history`} className="relative flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border border-rule-2 bg-paper-2 p-3 text-center text-muted hover:bg-paper-3">
          <Icon name="history" className="h-12 w-12 text-accent-deep" />
          <span className="text-sm font-medium leading-tight text-ink-2">History</span>
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {active.map((o, i) => {
          const late = o.flags.overdue;
          const status = late ? `Late by ${o.flags.daysOverdue} day${o.flags.daysOverdue === 1 ? "" : "s"}` : BAND_LABEL[o.band].text;
          const pill = late || o.band === "red" ? "bg-thread" : o.band === "green" ? "bg-leaf" : "bg-cloth";
          return (
            <li key={o.id} className={`${card} relative space-y-3 border-l-4 transition-colors hover:bg-paper-3/50 active:bg-paper-3 ${late ? "border-l-thread" : BAND_CLASS[o.band]}`}>
              <div className="flex items-start gap-3">
                <PositionTile n={i + 1} />
                <Link href={`/m/${token}/orders/${o.id}`} className="group min-w-0 flex-1 after:absolute after:inset-0 after:content-['']" aria-label={`Open order ${o.orderNumber}, ${o.customerName}`}>
                  <p className="break-words text-xl font-medium leading-snug group-hover:underline">
                    #{o.orderNumber} - <bdi translate="no">{o.customerName}</bdi>
                  </p>
                  {o.designNumber && <p className="text-base font-medium text-accent-deep">Design: <bdi translate="no">{o.designNumber}</bdi></p>}
                  {o.itemLabels.length === 0 && <p className="text-base text-muted">No items yet</p>}
                  {left(o.id) && <p className="text-base font-medium text-[#92400E]">{left(o.id)}</p>}
                </Link>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-3 py-1 text-sm font-medium text-white ${pill}`}>{status}</span>
                  {o.badge && <span className={chipAttention}>{o.badge}</span>}
                </div>
              </div>

              {o.itemLabels.length > 0 && (
                <ul className="flex flex-wrap gap-2 text-base">
                  {o.itemLabels.map((label, k) => (
                    <li key={k} className="rounded-xl bg-paper-3 px-3 py-1.5 font-medium text-ink-2">{label}</li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-rule-2 bg-paper-2 px-3 py-2.5 text-base">
                <span className="flex items-center gap-2">
                  <Icon name="calendar" className={`h-5 w-5 ${late ? "text-thread" : "text-muted"}`} />
                  <span>Due <b className="font-semibold">{fmtDay(o.karigarDueDate)}</b></span>
                </span>
                {o.progress.total > 0 && (
                  <span className="rounded-lg bg-accent-soft px-3 py-1 text-sm font-medium text-accent-deep">
                    {`Steps ${o.progress.done} of ${o.progress.total}`}
                  </span>
                )}
              </div>
              <StageTrack steps={o.track} />
              {o.flags.stale && <p className="text-base font-medium text-thread">Please send an update</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
