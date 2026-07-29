"use client";

import { useEffect, useState } from "react";

const storageKey = "apec-demo-banner-dismissed";

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(window.localStorage.getItem(storageKey) === "true");
  }, []);

  function dismiss() {
    window.localStorage.setItem(storageKey, "true");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="demo-banner" role="status">
      <span className="demo-banner-icon" aria-hidden="true">
        !
      </span>
      <p>
        <strong>Demo build</strong> — all data below is fictional sample content.
        No real member, elder, or caregiver information is stored here.
      </p>
      <button type="button" onClick={dismiss} aria-label="Dismiss demo notice">
        Dismiss
      </button>
    </div>
  );
}
