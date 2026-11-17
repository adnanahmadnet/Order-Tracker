"use client";

import { useEffect } from "react";

/**
 * Opens the browser's print window (the same as Ctrl+P) once the page and its pictures have loaded.
 * Used by the order page's "Print" button (`?autoprint=1`).
 */
export function AutoPrint() {
  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      window.print();
    };
    const wait = Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise<void>((res) => { img.onload = img.onerror = () => res(); })),
    );
    wait.then(() => setTimeout(go, 300));
    const stop = setTimeout(go, 4000); // a slow picture must not stop the print window from opening
    return () => clearTimeout(stop);
  }, []);
  return null;
}
