import { stepIconName } from "@/lib/step-icon";
import type { TrackStep } from "@/lib/track";
import { Icon } from "./Icon";

/**
 * The progress bar of an order or an item: Order received, the steps, Shipped. Every step has its picture (scissors for cutting,
 * a thread and needle for stitching, a sewing machine for embroidery...) with its name small under it, so it is known by sight. A filled circle with a small tick is done, a ringed one is where the work is
 * now, a pale one is still to come. A step with no known picture shows a tick or a dot as before.
 */
export function StageTrack({ steps }: { steps: TrackStep[] }) {
  if (steps.length < 2) return null;
  const now = steps.find((s) => s.state === "current");
  return (
    <ol className="flex items-start overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={now ? `Progress. Now: ${now.label}` : "Progress. All done"}>
      {steps.map((s, i) => {
        const icon = stepIconName(s.label);
        return (
          <li key={`${s.label}-${i}`} className="relative flex min-w-[3.6rem] flex-1 flex-col items-center gap-1 text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute end-1/2 top-[18px] h-0.5 w-full -translate-y-1/2 ${s.state === "todo" ? "bg-rule-2" : "bg-accent"}`}
              />
            )}
            <span
              aria-hidden
              className={`relative z-10 grid h-9 w-9 place-items-center rounded-full border-2 ${
                s.state === "done"
                  ? "border-accent bg-accent text-accent-ink"
                  : s.state === "current"
                    ? "border-accent bg-paper-2 text-accent-deep ring-4 ring-accent/20"
                    : "border-rule-2 bg-paper-2 text-muted"
              }`}
            >
              {icon ? (
                <Icon name={icon} className="h-5 w-5" />
              ) : s.state === "done" ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12.5 4.5 4.5L19 7.5" />
                </svg>
              ) : s.state === "current" ? (
                <span className="h-3 w-3 rounded-full bg-accent" />
              ) : null}
              {icon && s.state === "done" && (
                <span className="absolute -bottom-1 -end-1 grid h-4 w-4 place-items-center rounded-full bg-ok text-white ring-2 ring-paper-2">
                  <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                </span>
              )}
            </span>
            <span className={`track-label break-words text-[9.5px] leading-tight  ${s.state === "current" ? "font-medium text-ink" : s.state === "done" ? "text-ink-2" : "text-muted"}`}>
              {s.label}
              <span className="sr-only">{s.state === "done" ? " (done)" : s.state === "current" ? " (now)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
