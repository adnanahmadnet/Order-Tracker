import { isAdmin } from "@/lib/admin-auth";
import { orderVideo } from "@/lib/order-videos";
import { videoResponse } from "@/lib/video-response";

// Admin watches a video attached to an order.
export async function GET(req: Request, ctx: { params: Promise<{ id: string; videoId: string }> }) {
  if (!(await isAdmin())) return Response.json({ error: "Admin login needed." }, { status: 401 });
  const { id, videoId } = await ctx.params;
  const row = orderVideo(Number(id), Number(videoId));
  if (!row) return new Response("Not found", { status: 404 });
  return videoResponse(req, row);
}
