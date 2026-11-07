"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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
    // A new controller means the update was applied: reload once to pick it up.
    const onControllerChange = () => window.location.reload();
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
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [ios, setIos] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [deferred, setDeferred] = useState<Event & { prompt: () => Promise<void> } | null>(null);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    if (isStandalone()) return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    setIos(isIos());
    setVisible(true);
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as Event & { prompt: () => Promise<void> });
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const reshow = () => {
      window.localStorage.removeItem(DISMISS_KEY);
      setVisible(true);
    };
    window.addEventListener(INSTALL_EVENT, reshow);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener(INSTALL_EVENT, reshow);
    };
  }, [pathname]);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setShowIosSteps(false);
  }

  async function install() {
    if (ios) {
      setShowIosSteps(true);
      return;
    }
    if (deferred) {
      await deferred.prompt();
      setDeferred(null);
      setCanInstall(false);
      return;
    }
    // Installable prompt not available in this browser: explain the manual path.
    setShowIosSteps(true);
  }

  if (!visible || pathname?.startsWith("/admin")) return null;

  return (
    <div className="bg-brand-700 text-white" role="region" aria-label="Download the app">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-brand-700 shadow-sm">
          CM
        </span>
        <p className="flex-1 text-sm font-medium">
          <strong>Download App</strong> — install Central Mart on your phone for lightning-fast Kota grocery delivery.
        </p>
        <button onClick={install} className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-brand-800">
          {ios ? "How to install" : canInstall ? "Install App" : "Download App"}
        </button>
        <button onClick={dismiss} className="px-2 py-2 text-sm text-brand-100" aria-label="Dismiss download banner">
          ✕
        </button>
      </div>
      {showIosSteps ? (
        <div className="border-t border-white/20 bg-brand-800">
          <div className="mx-auto max-w-6xl px-4 py-3 text-sm">
            {ios ? (
              <ol className="list-decimal space-y-1 pl-5">
                <li>
                  Tap the <strong>Share</strong> button in Safari (the square with an arrow pointing up).
                </li>
                <li>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong>Add</strong> — the app icon appears on your home screen and opens fullscreen.
                </li>
              </ol>
            ) : (
              <p>
                Your browser did not offer an automatic install. In Chrome on Android: tap the ⋮ menu → <strong>Install app</strong>. On desktop Chrome: the install icon in the address bar.
              </p>
            )}
            <button onClick={() => setShowIosSteps(false)} className="mt-2 text-sm text-brand-100 underline">
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
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
