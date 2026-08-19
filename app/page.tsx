import Image from "next/image";
import { MobileMenu } from "./components/MobileMenu";
import { PolicyResources } from "./components/PolicyResources";
import { PublicMissingElderRegistry } from "./components/PublicMissingElderRegistry";

const vettingSteps = [
  "NIN verification with consent",
  "Police Character Certificate",
  "Home address verification",
  "Two employment references",
  "Two guarantors",
  "Qualification and licence checks",
  "Competency interview",
  "Practical care assessment",
  "Medical fitness declaration",
  "Six-month probation reviews",
];

const modules = [
  {
    title: "Member Portal",
    text: "Profiles, renewals, announcements, downloadable documents, and member status.",
    icon: "members",
  },
  {
    title: "Admin Desk",
    text: "Approvals, member records, document uploads, renewal tracking, and audit logs.",
    icon: "admin",
  },
  {
    title: "Missing Elders",
    text: "Moderated alerts for missing elderly persons with found and closed case tracking.",
    icon: "missing",
  },
  {
    title: "Caregiver Registers",
    text: "Reference checks, consent records, vetting progress, and restricted safeguarding incidents.",
    icon: "shield",
  },
];

const trustSignals = [
  "Officer-reviewed public alerts",
  "Private medical details",
  "Role-based member access",
];

function AppIcon({ name }: { name: string }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "members") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3.5 20c.8-3.5 3-5.3 5.5-5.3s4.7 1.8 5.5 5.3" />
        <path d="M15.5 10.5a3 3 0 1 0 0-5.9" />
        <path d="M16 15c2.2.6 3.7 2.2 4.5 5" />
      </svg>
    );
  }

  if (name === "admin") {
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M8 4v5" />
        <path d="m8.5 14 2 2 4-4" />
      </svg>
    );
  }

  if (name === "missing") {
    return (
      <svg {...common}>
        <path d="M12 21s-7-4.8-7-11a7 7 0 0 1 14 0c0 6.2-7 11-7 11Z" />
        <circle cx="12" cy="10" r="2.4" />
        <path d="M9 3.8 7.5 2.3M15 3.8l1.5-1.5" />
      </svg>
    );
  }

  if (name === "phone") {
    return (
      <svg {...common}>
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6A2 2 0 0 1 22 16.9Z" />
      </svg>
    );
  }

  if (name === "photo") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="m21 15-4-4-5 5-2-2-4 4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 3 4.5 6v6c0 4.5 3.2 7.4 7.5 9 4.3-1.6 7.5-4.5 7.5-9V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand-lockup" href="#top" aria-label="APEC Lagos home">
          <Image src="/logo.svg" alt="" className="brand-mark" width={64} height={64} priority />
          <span>
            <strong>APEC Lagos</strong>
            <small>Association of Providers of Elderly Care</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#missing-elders">Missing Elders</a>
          <a href="#caregiver-register">Caregiver Register</a>
          <a href="#vetting">Vetting</a>
          <a href="#resources">Resources</a>
          <a href="/apply">Apply for Membership</a>
        </nav>
        <a className="header-action" href="/portal">
          Login
        </a>
        <MobileMenu />
      </header>

      <section className="hero" id="top">
        <div className="hero-content">
          <div className="eyebrow">Elderly care association platform</div>
          <h1>Trusted infrastructure for elderly care providers.</h1>
          <p>
            APEC Lagos brings membership operations, missing elder alerts,
            caregiver references, and safeguarding reviews into one secure,
            coordinated platform for elderly care providers across Lagos State.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#missing-elders">
              Report a Missing Elder
            </a>
            <a className="secondary-button" href="/apply">
              Apply for Membership
            </a>
          </div>
          <div className="trust-row" aria-label="Platform trust signals">
            {trustSignals.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="command-panel" aria-label="APEC platform overview">
          <div className="panel-header">
            <span>Safeguarding Response</span>
            <strong>Operational</strong>
          </div>
          <div className="case-spotlight">
            <span>Missing elder reporting</span>
            <b>Send verified details to the safeguarding team</b>
            <small>Reports remain private until an authorised officer approves publication.</small>
          </div>
          <div className="priority-list">
            <div>
              <b>Public intake</b>
              <span>Families and members of the public can submit a report.</span>
            </div>
            <div>
              <b>Officer verification</b>
              <span>Safeguarding staff review each report before publication.</span>
            </div>
            <div>
              <b>Protected information</b>
              <span>Medical, family, and reporter details remain restricted.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="module-strip" aria-label="Main app modules">
        {modules.map((module) => (
          <article key={module.title}>
            <div className="module-icon">
              <AppIcon name={module.icon} />
            </div>
            <h2>{module.title}</h2>
            <p>{module.text}</p>
          </article>
        ))}
      </section>

      <section className="workspace-band" id="missing-elders">
        <div className="section-heading">
          <span>Public safeguarding</span>
          <h2>Missing Elders Registry</h2>
          <p>
            Notices are reviewed by authorised officers before publication.
            Private family, medical, and submitter details stay restricted.
          </p>
        </div>
        <PublicMissingElderRegistry />
      </section>

      <section className="workspace-band contrast" id="caregiver-register">
        <div className="section-heading">
          <span>Restricted member tools</span>
          <h2>Caregiver Reference and Safeguarding Register</h2>
          <p>
            The positive reference register helps good caregivers prove
            experience. Serious incident records are restricted, evidence-led,
            and reviewed before sharing.
          </p>
        </div>
        <div className="register-grid">
          <div className="table-panel">
            <div className="panel-title">
              <h3>Caregiver Reference Register</h3>
              <span>Approved members</span>
            </div>
            <div className="register-access-copy">
              <h4>Verified employment history, shared responsibly.</h4>
              <p>
                Member organisations can contribute employment references only
                with the caregiver&apos;s consent. Access is restricted to approved
                association users carrying out legitimate recruitment checks.
              </p>
              <ul>
                <li>Previous role and employment period</li>
                <li>Supervisor reference and rehire eligibility</li>
                <li>Consent status and verification outcome</li>
                <li>Documented correction and dispute process</li>
              </ul>
              <a className="inline-action" href="/portal">Member sign in</a>
            </div>
          </div>
          <div className="incident-panel">
            <h3>Safeguarding Incident Register</h3>
            <p>
              This replaces a casual blacklist with a controlled Do Not Rehire
              and incident review workflow.
            </p>
            <article className="safeguarding-standard">
              <span>Controlled access</span>
              <h4>Evidence-led review before any restriction</h4>
              <p>
                Incident information is not a public blacklist. Authorised
                reviewers document evidence, responses, decisions, and appeals.
              </p>
            </article>
            <ul>
              <li>Evidence upload required before review</li>
              <li>Reporting organisation and reviewer recorded</li>
              <li>Caregiver response and dispute outcome tracked</li>
              <li>Access limited to approved member administrators</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="workspace-band warm" id="vetting">
        <div className="section-heading">
          <span>Recruitment controls</span>
          <h2>Caregiver Vetting Workflow</h2>
          <p>
            A shared checklist standardises recruitment checks across member
            care homes while keeping consent and audit history attached to each
            verification.
          </p>
        </div>
        <div className="checklist-grid">
          {vettingSteps.map((step, index) => (
            <div className="check-item" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="workspace-band resources" id="resources">
        <div className="section-heading">
          <span>APEC resource library</span>
          <h2>Policies and Guidance</h2>
          <p>
            Access official APEC Lagos policies and operational guidance
            published by authorised association administrators.
          </p>
        </div>
        <PolicyResources />
      </section>

      <section className="workspace-band membership" id="membership">
        <div className="section-heading">
          <span>Association operations</span>
          <h2>Membership and Admin Portal</h2>
          <p>
            Built on a secure Supabase backend with role-based access for
            members, secretaries, committee users, and admins.
          </p>
        </div>
        <div className="portal-grid">
          <a href="/apply">
            <h3>Member Dashboard</h3>
            <p>
              Apply online, complete compliance review, then receive secure
              access to membership status, renewals, and announcements.
            </p>
            <span>Start membership application</span>
          </a>
          <a href="/portal">
            <h3>Admin Dashboard</h3>
            <p>
              Approvals, member search, document upload, renewal tracking,
              announcements, exports, and audit trail.
            </p>
            <span>Secretary, admin, super admin</span>
          </a>
          <a href="/portal">
            <h3>Safeguarding Records</h3>
            <p>
              Controlled records for missing elder cases, caregiver references,
              compliance checks, and incident reviews.
            </p>
            <span>Authorised access only</span>
          </a>
        </div>
      </section>

      <footer>
        <div className="footer-icon-strip" aria-hidden="true">
          <span><AppIcon name="members" /></span>
          <span><AppIcon name="missing" /></span>
          <span><AppIcon name="phone" /></span>
        </div>
        <Image src="/logo.svg" alt="" width={52} height={52} />
        <span>
          APEC Lagos. Built for elderly care membership, coordination, and
          safeguarding.
        </span>
      </footer>
    </main>
  );
}
