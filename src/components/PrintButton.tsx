"use client";

import { btnPrimary } from "./ui";

/**
 * Print. With `pdfUrl` it prints the same PDF as Download PDF, so the paper looks the same on every device (Safari on
 * iPhone and iPad does not repeat the page header and cuts long items when it prints the web page itself).
 * A computer with Chrome or Edge prints it straight away from a hidden frame; phones, tablets and other browsers open
 * the PDF, to print it from there (iPhone: Share > Print). Without `pdfUrl` it prints the page (the item report).
 */
export function PrintButton({ pdfUrl }: { pdfUrl?: string }) {
  const print = () => {
    if (!pdfUrl) return window.print();
    const ua = navigator.userAgent;
    const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1; // an iPad says it is a Mac
    const mobile = /Android|iPhone|iPad|iPod|Mobile/.test(ua) || touchMac;
    const chromium = /Chrome\/|Edg\//.test(ua) && !/OPR\//.test(ua);
    if (mobile || !chromium) {
      if (!window.open(pdfUrl, "_blank")) window.location.href = pdfUrl; // a blocked new tab: open it here
      return;
    }
    document.getElementById("print-pdf-frame")?.remove();
    const frame = document.createElement("iframe");
    frame.id = "print-pdf-frame";
    frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        window.open(pdfUrl, "_blank");
      }
    };
    frame.src = pdfUrl;
    document.body.appendChild(frame);
  };
  return (
    <button type="button" onClick={print} className={btnPrimary}>
      Print
    </button>
  );
}
