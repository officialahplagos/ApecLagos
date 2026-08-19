"use client";

import { Download, MoreVertical, Share, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

function isRunningStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as StandaloneNavigator).standalone)
  );
}

function isAppleMobileDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function InstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [appleDevice, setAppleDevice] = useState(false);
  const installButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const closeInstructions = useCallback(() => {
    setShowInstructions(false);
    window.requestAnimationFrame(() => installButtonRef.current?.focus());
  }, []);

  useEffect(() => {
    const registerServiceWorker = () => {
      if (!("serviceWorker" in navigator)) return;
      void navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
    };

    if (document.readyState === "complete") registerServiceWorker();
    else window.addEventListener("load", registerServiceWorker, { once: true });

    if (isRunningStandalone()) {
      return () => window.removeEventListener("load", registerServiceWorker);
    }

    const revealTimer = window.setTimeout(() => {
      setAppleDevice(isAppleMobileDevice());
      setVisible(true);
    }, 0);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setInstallPrompt(null);
      setShowInstructions(false);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.clearTimeout(revealTimer);
      window.removeEventListener("load", registerServiceWorker);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!showInstructions) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeInstructions();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeInstructions, showInstructions]);

  async function handleInstall() {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      <button
        ref={installButtonRef}
        className="install-app-button"
        type="button"
        onClick={handleInstall}
      >
        <Download aria-hidden="true" />
        <span>Install App</span>
      </button>

      {showInstructions ? (
        <div
          className="install-dialog-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeInstructions();
          }}
        >
          <section
            className="install-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-dialog-title"
            aria-describedby="install-dialog-description"
          >
            <div className="install-dialog-head">
              <Image src="/logo.svg" alt="" width={54} height={54} />
              <div>
                <span>APEC Lagos</span>
                <h2 id="install-dialog-title">Install the app</h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="Close installation instructions"
                onClick={closeInstructions}
              >
                <X aria-hidden="true" />
              </button>
            </div>

            {appleDevice ? (
              <ol id="install-dialog-description" className="install-steps">
                <li>
                  <Share aria-hidden="true" />
                  <span>Open the browser Share menu.</span>
                </li>
                <li>
                  <Download aria-hidden="true" />
                  <span>Select Add to Home Screen.</span>
                </li>
                <li>
                  <span className="install-step-number">3</span>
                  <span>Confirm Add to place APEC Lagos with your apps.</span>
                </li>
              </ol>
            ) : (
              <div id="install-dialog-description" className="install-browser-help">
                <MoreVertical aria-hidden="true" />
                <p>
                  Open your browser menu and choose <strong>Install APEC Lagos</strong>
                  {" "}or <strong>Add to Home Screen</strong>.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
