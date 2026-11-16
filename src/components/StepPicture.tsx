import { stepIconName } from "@/lib/step-icon";
import { Icon } from "./Icon";

/** The picture of a step in a round tile (scissors for cutting...). Nothing is shown for a step name with no known word. */
export function StepPicture({ label, className = "h-14 w-14", badge }: { label: string; className?: string; badge?: "done" | "locked" | null }) {
  const icon = stepIconName(label);
  if (!icon) return null;
  return (
    <span aria-hidden className={`relative grid shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-deep ${className}`}>
      <Icon name={icon} className="h-9 w-9" />
      {badge && (
        <span className={`absolute -bottom-1 -end-1 grid h-6 w-6 place-items-center rounded-full text-white ring-2 ring-paper-3 ${badge === "done" ? "bg-ok" : "bg-muted"}`}>
          {badge === "done" ? (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <Icon name="lock" className="h-3.5 w-3.5" />
          )}
        </span>
      )}
    </span>
  );
}
