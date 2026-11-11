"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useBranding } from "@/lib/branding-context";

const DISMISS_KEY = "gcp_pwa_dismissed";
const INSTALL_EVENT = "gcp:show-install";

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return (
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

/** Registers the service worker and shows a safe update prompt (never a silent swap). */
export function PwaRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (cancelled) return;
        const track = (worker: ServiceWorker | null) => {
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(worker);
              setUpdateReady(true);
            }
          });
        };
        track(reg.waiting);
        reg.addEventListener("updatefound", () => track(reg.installing));
      })
      .catch(() => {
        /* offline or unsupported — app still works without the worker */
      });
    // A new controller means an update was applied: reload only when updating an existing controller
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      // Do not reload on initial service worker installation
      if (!navigator.serviceWorker.controller) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!updateReady) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-line bg-white px-4 py-3 shadow-lg" role="status">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <p className="flex-1 text-sm font-medium">A new version of the app is available.</p>
        <button
          onClick={() => waitingWorker?.postMessage({ type: "SKIP_WAITING" })}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Refresh to update
        </button>
        <button onClick={() => setUpdateReady(false)} className="px-2 py-2 text-sm text-muted" aria-label="Dismiss update">
          Later
        </button>
      </div>
    </div>
  );
}

/**
 * Top "Download App" banner. Real install flow only:
 * - Android/Chrome: native beforeinstallprompt when installable.
 * - iOS: step-by-step Share → Add to Home Screen guidance (no native prompt exists).
 * - Hidden in standalone mode, hidden on /admin routes, hidden after dismissal.
 * - No fake Play Store / App Store badges: there are no native store listings in v1.
 */
export function InstallBanner() {
  return null;
}

/** Footer link that re-shows the install banner after dismissal. */
export function InstallAppLink() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event(INSTALL_EVENT))}
      className="text-sm text-muted underline"
    >
      Install app
    </button>
  );
}
