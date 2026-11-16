import { isAdmin } from "@/lib/admin-auth";
import { renderOrderPdf } from "@/lib/pdf";
import { buildPrintData, hasSlips } from "@/lib/print";

// Admin side (needs the admin sign-in). `?only=slips` gives just the tailor slips; `?view=1` shows the PDF instead of downloading it (Print button).
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Admin login needed." }, { status: 401 });
  const data = buildPrintData(Number((await ctx.params).id));
  if (!data) return new Response("Not found", { status: 404 });
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
