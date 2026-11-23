import { requireMaster } from "@/lib/master-session";
import { masterOrder } from "@/lib/orders";
import { orderVideo } from "@/lib/order-videos";
import { videoResponse } from "@/lib/video-response";

// A master watches a video attached to one of his own (sent) orders. Anything else is a 404.
export async function GET(req: Request, ctx: { params: Promise<{ token: string; id: string; videoId: string }> }) {
  const { token, id, videoId } = await ctx.params;
  const master = await requireMaster(token);
  if (!master) return new Response("Not found", { status: 404 });
  const order = masterOrder(master.id, Number(id));
  const row = order ? orderVideo(order.id, Number(videoId)) : null;
  if (!row) return new Response("Not found", { status: 404 });
  return videoResponse(req, row);
}
