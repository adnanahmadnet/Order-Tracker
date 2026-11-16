import { requireMaster } from "@/lib/master-session";
import { masterOrder } from "@/lib/orders";
import { renderOrderPdf } from "@/lib/pdf";
import { buildPrintData, hasSlips } from "@/lib/print";

// Master side (his own orders only). `?only=slips` gives just the tailor slips; `?view=1` shows the PDF instead of downloading it (Print button).
export async function GET(req: Request, ctx: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await ctx.params;
  const master = await requireMaster(token);
  if (!master) return new Response("Not found", { status: 404 });
  const order = masterOrder(master.id, Number(id));
  const data = order ? buildPrintData(order.id) : null;
  if (!order || !data) return new Response("Not found", { status: 404 });
  const q = new URL(req.url).searchParams;
  const slips = q.get("only") === "slips";
  const view = q.get("view") === "1"; // the Print button opens the PDF to print it instead of downloading it
  if (slips && !hasSlips(data)) return new Response("This order has no tailor slips.", { status: 404 });
  const pdf = await renderOrderPdf(data, slips ? { only: "slips" } : {});
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `${view ? "inline" : "attachment"}; filename="order-${data.orderNumber}${slips ? "-tailor-slips" : ""}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
