import { requireMaster } from "@/lib/master-session";
import { MAX_TEXTS, translateTexts } from "@/lib/translate";

// The master's screen asks for Urdu for text it could not find in the hand-written list (mostly text the office typed).
// Only a master who has opened his link and entered his code can ask. Answers are saved, so each text is translated once.
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const master = await requireMaster(token);
  if (!master) return Response.json({ error: "Please open your link and enter your code again." }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const texts = (body as { texts?: unknown })?.texts;
  if (!Array.isArray(texts) || texts.length > MAX_TEXTS * 2) return Response.json({ error: "Bad request." }, { status: 400 });
  const clean = texts.filter((t): t is string => typeof t === "string");

  return Response.json({ ur: await translateTexts(clean) });
}
