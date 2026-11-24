import Link from "next/link";
import { DownloadLink } from "@/components/DownloadLink";
import { Icon } from "@/components/Icon";
import { PinForm } from "@/components/PinForm";
import { fmtDate, PageTitle } from "@/components/ui";
import { linkState, requireMaster } from "@/lib/master-session";
import { masterSentShipments } from "@/lib/shipping";

export const dynamic = "force-dynamic";

type Sent = ReturnType<typeof masterSentShipments>[number];

/** The items of a shipment, grouped by customer (one shipment can hold several customers, with one bill). */
function byCustomer(s: Sent) {
  const groups = new Map<number, { orderId: number; orderNumber: number; customerName: string; designNumber: string | null; items: { label: string; returned: boolean }[] }>();
  for (const i of s.items) {
    const g = groups.get(i.orderId) ?? { orderId: i.orderId, orderNumber: i.orderNumber, customerName: i.customerName, designNumber: i.designNumber, items: [] };
    g.items.push({ label: i.label, returned: i.returned });
    groups.set(i.orderId, g);
  }
  return [...groups.values()];
}

/** A small box with one fact in it, so every fact has its own place. */
const box = "rounded-xl border border-rule bg-paper-3/60 px-3 py-1.5 text-base";

/**
 * For a master: everything he has sent, newest first. Each shipment is a folded row (the date, and who it was for); tap it to
 * open it and see the customer, the design, the items and the bill, each in its own small box. It stays after the orders are
 * completed (the Finished page forgets them), because he sometimes needs to look at a bill again.
 */
export default async function MasterHistory({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ e?: string }> }) {
  const { token } = await params;
  const { e } = await searchParams;
  const state = await linkState(token);
  if (state === "invalid") return <p className="text-xl">This link is not valid. Ask the office for a new link.</p>;
  if (state === "need-pin") return <PinForm token={token} error={e} />;
  const master = (await requireMaster(token))!;
  const sent = masterSentShipments(master.id);
  const photo = (id: number, thumb = false) => `/api/m/${token}/photos/${id}${thumb ? "?thumb=1" : ""}`;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link href={`/m/${token}`} className="link inline-flex min-h-12 items-center gap-2 text-lg font-medium">
        <Icon name="arrow" className="h-4 w-4 rotate-180 rtl:rotate-0" /> Back
      </Link>
      <PageTitle icon="history" large>History</PageTitle>
      {sent.length === 0 ? (
        <p className="text-xl">No sent orders yet.</p>
      ) : (
        <>
          <p className="text-base text-muted">Sent orders and their bills are kept here.</p>
          <ul className="space-y-2">
            {sent.map((s) => {
              const groups = byCustomer(s);
              const first = groups[0];
              return (
                <li key={s.id} className="rounded-2xl border border-rule bg-paper-2">
                  <details className="group/sent">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-medium">{fmtDate(s.submittedAt)}</span>
                        {first && (
                          <span className="block truncate text-base text-muted">
                            #{first.orderNumber} <bdi translate="no">{first.customerName}</bdi>
                            {groups.length > 1 && <span translate="no"> +{groups.length - 1}</span>}
                          </span>
                        )}
                      </span>
                      {s.billPhotoId !== null && <Icon name="receipt" className="h-6 w-6 shrink-0 text-accent-deep" />}
                      <Icon name="chevron" className="h-6 w-6 shrink-0 text-muted transition-transform group-open/sent:rotate-180" />
                    </summary>

                    <div className="space-y-3 border-t border-rule px-4 py-3">
                      {groups.map((g) => (
                        <div key={g.orderId} className="space-y-1.5">
                          <p className={box}>
                            <Link href={`/m/${token}/orders/${g.orderId}`} className="link font-medium">
                              #{g.orderNumber} <bdi translate="no">{g.customerName}</bdi>
                            </Link>
                          </p>
                          {g.designNumber && (
                            <p className={box}>
                              Design: <bdi translate="no">{g.designNumber}</bdi>
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {g.items.map((it, n) => (
                              <p key={n} className={box}>
                                {it.label}
                                {it.returned && <span className="ms-1.5 font-medium text-bad">Sent back</span>}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}

                      <div className="flex flex-wrap items-start gap-4 pt-1">
                        {s.billPhotoId !== null ? (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted">Bill</p>
                            <a href={photo(s.billPhotoId)} target="_blank" rel="noreferrer" aria-label="Open this image" className="block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo(s.billPhotoId, true)} alt="Bill" className="h-20 w-20 rounded-lg border object-cover" />
                            </a>
                            <DownloadLink href={photo(s.billPhotoId)} label="Download bill" className="mini-btn" />
                          </div>
                        ) : (
                          <p className="text-sm text-muted">No bill photo</p>
                        )}
                        {s.packagePhotoId !== null && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted">Packed items</p>
                            <a href={photo(s.packagePhotoId)} target="_blank" rel="noreferrer" aria-label="Open this image" className="block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo(s.packagePhotoId, true)} alt="Packed items" className="h-20 w-20 rounded-lg border object-cover" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
