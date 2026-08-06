import type { Metadata } from "next";
import Link from "next/link";
import { MembershipApplicationForm } from "../components/MembershipApplicationForm";

export const metadata: Metadata = {
  title: "Apply for Membership | APEC Lagos",
  description:
    "Apply for membership of the Association of Providers of Elderly Care in Lagos State.",
};

export default function MembershipApplicationPage() {
  return (
    <main className="application-shell">
      <header className="application-header">
        <Link className="brand-lockup" href="/" aria-label="APEC Lagos home">
          <img src="/logo.svg" alt="" className="brand-mark" />
          <span>
            <strong>APEC Lagos</strong>
            <small>Association of Providers of Elderly Care</small>
          </span>
        </Link>
        <Link className="portal-ghost-button" href="/portal">Member sign in</Link>
      </header>

      <section className="application-layout">
        <aside className="application-aside">
          <span className="eyebrow">Membership application</span>
          <h2>A verified route into the association portal.</h2>
          <ol>
            <li><span>1</span><div><b>Submit</b><p>Provide your organisation and contact details.</p></div></li>
            <li><span>2</span><div><b>Compliance review</b><p>An authorised officer checks the application.</p></div></li>
            <li><span>3</span><div><b>Receive invitation</b><p>Approved contacts receive a secure password setup email.</p></div></li>
          </ol>
          <p className="application-privacy-note">
            Application details are restricted to authorised APEC Lagos
            compliance and administrative users.
          </p>
        </aside>
        <MembershipApplicationForm />
      </section>
    </main>
  );
}
