"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#missing-elders", label: "Missing Elders" },
  { href: "#caregiver-register", label: "Caregiver Register" },
  { href: "#vetting", label: "Vetting" },
  { href: "/apply", label: "Apply for Membership" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="mobile-menu">
      <button
        className="menu-button"
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`menu-overlay ${open ? "is-open" : ""}`} onClick={close} />

      <aside className={`mobile-drawer ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="drawer-head">
          <img src="/logo.svg" alt="" />
          <div>
            <strong>APEC Lagos</strong>
            <small>Provider platform</small>
          </div>
          <button
            className="menu-close-button"
            type="button"
            aria-label="Close navigation menu"
            onClick={close}
          >
            <span />
            <span />
          </button>
        </div>

        <nav aria-label="Mobile navigation">
          {links.map((link) => (
            <a href={link.href} key={link.href} onClick={close}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="drawer-actions">
          <a className="drawer-apply-action" href="/apply" onClick={close}>
            Apply for Membership
          </a>
          <a className="drawer-action" href="/portal" onClick={close}>
            Member Sign In
          </a>
        </div>
      </aside>
    </div>
  );
}
