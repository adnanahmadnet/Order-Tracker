import { isOtherLang } from "@/lib/i18n";
import { requireMaster } from "@/lib/master-session";
import { MAX_TEXTS, translateTexts } from "@/lib/translate";

// The master's screen asks for Urdu, Bengali or Hindi for text it could not find in the hand-written lists (mostly text the office typed).
// Only a master who has opened his link and entered his code can ask. Answers are saved, so each text is translated once per language.
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
  const { texts, lang } = (body ?? {}) as { texts?: unknown; lang?: unknown };
  if (!Array.isArray(texts) || texts.length > MAX_TEXTS * 2 || !isOtherLang(lang)) return Response.json({ error: "Bad request." }, { status: 400 });
  const clean = texts.filter((t): t is string => typeof t === "string");

  return Response.json({ ur: await translateTexts(clean, lang), lang });
}
