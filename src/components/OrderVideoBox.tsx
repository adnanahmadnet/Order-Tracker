"use client";

import { useRef, useState, useTransition } from "react";
import { removeOrderVideoAction } from "@/app/admin/actions";
import { Icon } from "./Icon";
import { btnSecondary } from "./ui";

export type VideoRow = { id: number; name: string; bytes: number };

const MAX_MB = 50;
const size = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Admin: the videos of a customer. A video chosen here is saved with the customer (it travels with the Save button). */
export function OrderVideoBox({ orderId, files }: { orderId?: number; files: VideoRow[] }) {
  const [list, setList] = useState(files);
  const [chosen, setChosen] = useState<File[]>([]);
  const [tooBig, setTooBig] = useState<string[]>([]);
  const [, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  // the file box always holds exactly the files in the "to be saved" list, so Save sends them
  function setFiles(next: File[]) {
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (input.current) input.current.files = dt.files;
    setChosen(next);
  }

  return (
    <section className="rounded-3xl border border-rule bg-paper-2 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-deep">
          <Icon name="video" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-medium leading-tight">Order video</h2>
          <p className="text-sm text-muted">Add a video for the master to watch. MP4, MOV or WebM, {MAX_MB} MB at most each.</p>
        </div>
      </div>

      {list.length > 0 && (
        <ul className="mt-3 space-y-2">
          {list.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-rule bg-white px-3 py-2">
              <span className="min-w-0 flex-1 basis-40 break-words text-base">
                {f.name} <span className="text-sm text-muted">({size(f.bytes)})</span>
              </span>
              <a href={`/api/admin/orders/${orderId}/videos/${f.id}`} target="_blank" rel="noreferrer" className={btnSecondary}>
                Watch
              </a>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full text-bad hover:bg-bad-soft"
                aria-label={`Remove ${f.name}`}
                onClick={() => {
                  if (!window.confirm(`Remove ${f.name} from this customer?`)) return;
                  start(async () => {
                    await removeOrderVideoAction(orderId!, f.id);
                    setList((l) => l.filter((x) => x.id !== f.id));
                  });
                }}
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="mt-3 block">
        <span className="mb-1 block text-sm font-medium text-muted">{list.length > 0 ? "Add another video" : "Choose a video"}</span>
        <input
          ref={input}
          type="file"
          name="orderVideo"
          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
          multiple
          className="file-input file-input-bordered w-full"
          onChange={(e) => {
            // more files are added to the ones already chosen; a file over the limit is left out and named
            const more = Array.from(e.target.files ?? []);
            const same = (a: File, b: File) => a.name === b.name && a.size === b.size;
            const big = more.filter((m) => m.size > MAX_MB * 1024 * 1024);
            setTooBig(big.map((b) => b.name));
            const ok = more.filter((m) => m.size <= MAX_MB * 1024 * 1024 && !chosen.some((c) => same(c, m)));
            setFiles([...chosen, ...ok]);
          }}
        />
      </label>
      {tooBig.length > 0 && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-bad">
          <Icon name="alert" className="h-4 w-4 shrink-0" />
          {tooBig.join(", ")} {tooBig.length === 1 ? "is" : "are"} over {MAX_MB} MB, so not added.
        </p>
      )}
      {chosen.length > 0 && (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-muted">Saved when you press Save (a big video can take a minute):</p>
          <ul className="space-y-2">
            {chosen.map((c, i) => (
              <li key={`${c.name}-${c.size}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-rule bg-white px-3 py-2">
                <span className="min-w-0 flex-1 basis-40 break-words text-base">
                  {c.name} <span className="text-sm text-muted">({size(c.size)})</span>
                </span>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full text-bad hover:bg-bad-soft"
                  aria-label={`Remove ${c.name}`}
                  onClick={() => setFiles(chosen.filter((_, n) => n !== i))}
                >
                  <Icon name="close" className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
