import { itemStageViews, referencePhotos } from "@/lib/stages";
import type { FieldDef } from "@/db/schema";
import { addNoteAction, completeStageAction, undoStageAction } from "@/app/m/actions";
import { stageInstructions, stageNotes } from "@/lib/history";
import { StepNotesList } from "./HistoryList";
import { PhotoUpload } from "./PhotoUpload";
import { DownloadLink } from "@/components/DownloadLink";
import { btnPrimary } from "./ui";
import { Icon } from "@/components/Icon";
import { StepPicture } from "@/components/StepPicture";
import { stepIconName } from "@/lib/step-icon";

/** Reference pictures and the step list (with photo gate) for one item, for the master. */
export function MasterStages({
  token,
  orderId,
  itemId,
  fields,
  skipKeys = [],
  turn,
  confirmed = true,
}: {
  token: string;
  orderId: number;
  itemId: number;
  fields: FieldDef[];
  skipKeys?: string[]; // picture fields shown elsewhere (the design the customer chose)
  confirmed?: boolean; // the master pressed "I have seen this order" (no step can be finished before that)
  turn: boolean; // is it this master's turn on the order (can he finish steps)?
}) {
  const stages = itemStageViews(itemId);
  const notes = stageNotes(itemId);
  const instructions = stageInstructions(itemId);
  const refs = referencePhotos(itemId).filter((r) => !skipKeys.includes(r.fieldKey ?? ""));
  const labelOf = (key: string | null) => fields.find((f) => f.key === key)?.label ?? "Picture";
  const img = (id: number, thumb = false) => `/api/m/${token}/photos/${id}${thumb ? "?thumb=1" : ""}`;
  // the pictures grouped by the field they belong to, in the order of the form
  const groups = [...new Set(refs.map((r) => r.fieldKey ?? ""))].map((key) => ({
    label: labelOf(key || null),
    photos: refs.filter((r) => (r.fieldKey ?? "") === key),
  }));

  return (
    <>
      {groups.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xl font-medium">Pictures</p>
            {refs.length > 1 && (
              <a href={`/api/m/${token}/items/${itemId}/pictures`} download className="btn btn-quiet h-auto min-h-11 gap-2 px-4 py-2 text-base">
                <Icon name="download" className="h-5 w-5 shrink-0" />
                {`Download all (${refs.length})`}
              </a>
            )}
          </div>
          {groups.map((g) => (
            <div key={g.label} className="space-y-2">
              <p className="flex items-center gap-2 text-base font-medium text-muted">
                {g.label}
                <span className="rounded-full bg-paper-3 px-2 text-sm text-ink">{g.photos.length}</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {g.photos.map((r) => (
                  <div key={r.id} className="relative aspect-square overflow-hidden rounded-2xl border border-rule bg-paper-3">
                    <a href={img(r.id)} target="_blank" rel="noreferrer" className="block h-full w-full" aria-label={`Open picture, ${g.label}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img(r.id, true)} alt={g.label} className="h-full w-full object-cover" />
                    </a>
                    {/* with "Download all" above there is no icon on each picture; a lone picture keeps its own */}
                    {refs.length === 1 && (
                      <a
                        href={`${img(r.id)}?download=1`}
                        download
                        aria-label="Download this picture"
                        title="Download"
                        className="absolute bottom-1.5 end-1.5 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink shadow"
                      >
                        <Icon name="download" className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {stages.length > 0 && (
        <div className="space-y-2">
          <p className="text-lg font-medium">Steps</p>
          <ol className="space-y-2">
            {stages.map((s, n) => {
              const photo = s.latestPhoto;
              // "Mark complete" sits at the end of the step's own row, next to its name
              const canComplete = s.status === "open" && turn && confirmed && s.photoOk && s.fieldsOk;
              const complete = canComplete ? (
                <form action={completeStageAction} className="ms-auto shrink-0 max-[420px]:w-full">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="orderId" value={orderId} />
                  <input type="hidden" name="itemId" value={itemId} />
                  <input type="hidden" name="stageKey" value={s.key} />
                  <button className={`${btnPrimary} step-btn gap-1.5`}>
                    <Icon name="check" className="h-5 w-5" /> Mark complete
                  </button>
                </form>
              ) : null;
              const header = (
                <>
                    <StepPicture label={s.label} badge={s.status === "done" ? "done" : s.status === "locked" ? "locked" : null} />
                    <span className={`min-w-[6.5rem] flex-1 ${stepIconName(s.label) ? "text-base text-ink-2" : ""}`}>
                      {s.status === "done" ? <Icon name="check" className="me-1 inline h-5 w-5" /> : s.status === "locked" ? <Icon name="lock" className="me-1 inline h-5 w-5" /> : null}
                      {n + 1}. {s.label}
                    </span>
                </>
              );
              const body = (
                <>
                  {/* only the number of days, never a date */}
                  {s.days && s.status !== "done" && <p className="text-base text-muted">{`Should take ${s.days} day${s.days === 1 ? "" : "s"}.`}</p>}

                  {instructions.get(s.key) && (
                    <div className="rounded-xl border border-accent/30 bg-white/80 px-3 py-2">
                      <p className="text-sm font-medium text-accent-deep">From the office</p>
                      <p className="whitespace-pre-wrap break-words text-lg">{instructions.get(s.key)}</p>
                    </div>
                  )}

                  {s.status === "open" && s.photo === "optional" && (
                    <div className="space-y-2">
                      <p className="text-lg">You can add images so the office can see your work (optional)</p>
                      {s.allPhotos.length > 0 && <StepImages photos={s.allPhotos} img={img} />}
                      <PhotoUpload
                        endpoint={`/api/m/${token}/photos`}
                        fields={{ itemId: String(itemId), stageKey: s.key }}
                        label={s.allPhotos.length > 0 ? "Add more images" : "Add image"}
                        multiple
                      />
                    </div>
                  )}

                  {s.status === "open" && s.photo === "upload" && (
                    <div className="space-y-2">
                      <p className="text-lg">Add at least one photo of your work to finish this step.</p>
                      {s.allPhotos.length > 0 && <StepImages photos={s.allPhotos} img={img} />}
                      <PhotoUpload
                        endpoint={`/api/m/${token}/photos`}
                        fields={{ itemId: String(itemId), stageKey: s.key }}
                        label={s.allPhotos.length > 0 ? "Add more images" : "Add image"}
                        multiple
                      />
                    </div>
                  )}

                  {s.status === "open" && s.photo === "required" && (
                    <div className="space-y-2">
                      <p className="text-lg">Photo needed</p>
                      {photo && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-start gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img(photo.id, true)} alt="Your photo" className="h-24 w-24 border object-cover" />
                            <p
                              className={`text-lg font-medium ${
                                photo.status === "approved" ? "text-leaf" : photo.status === "rejected" ? "text-thread" : "text-ink"
                              }`}
                            >
                              {photo.status === "pending" && "Waiting for approval"}
                              {photo.status === "approved" && "Approved ✓"}
                              {photo.status === "rejected" && `Rejected: ${photo.comment ?? "please send a new photo"}`}
                            </p>
                          </div>
                          <DownloadLink href={img(photo.id)} />
                        </div>
                      )}
                      {(!photo || photo.status === "rejected") && (
                        <PhotoUpload
                          endpoint={`/api/m/${token}/photos`}
                          fields={{ itemId: String(itemId), stageKey: s.key }}
                          label={photo ? "Send a new image" : "Add image"}
                          camera
                        />
                      )}
                    </div>
                  )}

                  {s.status === "done" && (s.photo === "optional" || s.photo === "upload") && s.allPhotos.length > 0 && <StepImages photos={s.allPhotos} img={img} />}

                  {s.status === "open" && s.requiredFields.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-lg">{s.fieldsOk ? "Everything is filled in" : "Fill these in before you finish this step:"}</p>
                      <ul className="space-y-1">
                        {s.requiredFields.map((rf) => (
                          <li key={rf.key} className={`flex items-center gap-2 text-base ${rf.filled ? "text-leaf" : "text-ink"}`}>
                            <Icon name={rf.filled ? "check" : "alert"} className="h-5 w-5 shrink-0" />
                            <span>
                              {rf.label}
                              {!rf.filled && !rf.masterCanEdit && " (the office fills this in)"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(notes.get(s.key)?.length ?? 0) > 0 && <StepNotesList notes={notes.get(s.key)!} />}

                  {/* a step finished by mistake: only the last one he finished, and he has to open the step first (no accidental taps) */}
                  {s.status === "done" && s.lastDone && s.completedBy === "master" && turn && (
                    <form action={undoStageAction} className="space-y-1.5 rounded-xl border border-rule bg-white/80 px-3 py-2">
                      <input type="hidden" name="token" value={token} />
                      <input type="hidden" name="orderId" value={orderId} />
                      <input type="hidden" name="itemId" value={itemId} />
                      <input type="hidden" name="stageKey" value={s.key} />
                      <p className="text-base">Pressed Mark complete by mistake?</p>
                      <button className="btn btn-quiet step-btn gap-1.5">
                        <Icon name="remake" className="h-5 w-5" /> Undo this step
                      </button>
                    </form>
                  )}

                  {turn && s.status !== "locked" && (
                    <details className="group/note">
                      {/* a note is optional: the master taps the plus when he wants to write one */}
                      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-2 text-base font-medium text-ink-2 [&::-webkit-details-marker]:hidden">
                        <span className="grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-ink text-ink">
                          <Icon name="plus" className="h-5 w-5 transition-transform group-open/note:rotate-45" />
                        </span>
                        Add note
                      </summary>
                      <form action={addNoteAction} className="space-y-1.5 pt-2">
                        <input type="hidden" name="token" value={token} />
                        <input type="hidden" name="orderId" value={orderId} />
                        <input type="hidden" name="itemId" value={itemId} />
                        <input type="hidden" name="stageKey" value={s.key} />
                        <textarea name="text" rows={2} maxLength={1000} placeholder="Write a note about this step" aria-label={`Note for ${s.label}`} className="textarea w-full text-base leading-snug" />
                        <button className="btn btn-quiet step-btn">Add note</button>
                      </form>
                    </details>
                  )}

                  {s.status === "open" &&
                    (!turn ? (
                      <p className="text-base">You can finish this step after the orders above it.</p>
                    ) : !confirmed ? (
                      <p className="text-lg font-medium">First press &quot;I have seen this order&quot; at the top.</p>
                    ) : null)}
                </>
              );
              return s.status === "done" ? (
                <li key={s.key} className="rounded-2xl border border-ok/40 bg-ok-soft p-4">
                  {/* a finished step folds up; tap it to read its notes and pictures */}
                  <details className="group/step">
                    <summary className="flex cursor-pointer list-none items-center gap-3 text-xl font-medium [&::-webkit-details-marker]:hidden">
                      {header}
                      <Icon name="chevron" className="h-6 w-6 shrink-0 text-muted transition-transform group-open/step:rotate-180" />
                    </summary>
                    <div className="space-y-2 pt-3">{body}</div>
                  </details>
                </li>
              ) : (
                <li key={s.key} className={`space-y-2 rounded-2xl border p-4 ${s.status === "open" ? "border-bad/50 bg-bad-soft" : "border-bad/25 bg-bad-soft/60"}`}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xl font-medium">
                    {header}
                    {complete}
                  </div>
                  {body}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </>
  );
}

/** The images already sent for a step, as small pictures. Tap one to see it full size. */
function StepImages({ photos, img }: { photos: { id: number }[]; img: (id: number, thumb?: boolean) => string }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {photos.map((p) => (
        <a key={p.id} href={img(p.id)} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-xl border border-rule bg-paper-3" aria-label="Open this image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img(p.id, true)} alt="Image of your work" className="h-full w-full object-cover" />
        </a>
      ))}
    </div>
  );
}
