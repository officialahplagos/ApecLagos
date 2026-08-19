"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "#missing-elders", label: "Missing Elders" },
  { href: "#caregiver-register", label: "Caregiver Register" },
  { href: "#vetting", label: "Vetting" },
  { href: "#resources", label: "Resources" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.classList.add("mobile-menu-open");
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("mobile-menu-open");
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="mobile-menu">
      <button
        ref={menuButtonRef}
        className="menu-button"
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu aria-hidden="true" />
      </button>

      <div className={`menu-overlay ${open ? "is-open" : ""}`} onClick={close} />

      <aside
        className={`mobile-drawer ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        aria-modal={open || undefined}
        role="dialog"
      >
        <div className="drawer-head">
          <Image src="/logo.svg" alt="" width={52} height={52} />
          <div>
            <strong>APEC Lagos</strong>
            <small>Provider platform</small>
          </div>
          <button
            ref={closeButtonRef}
            className="menu-close-button"
            type="button"
            aria-label="Close navigation menu"
            onClick={close}
          >
            <X aria-hidden="true" />
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
