import { MobileMenu } from "./components/MobileMenu";
import { StatGrid } from "./components/StatGrid";

const missingElders = [
  {
    name: "Mrs. Abimbola A.",
    age: "78",
    lastSeen: "Ikeja GRA",
    date: "Today, 7:30 AM",
    risk: "Memory loss",
    contact: "0800 000 1122",
    status: "Active alert",
  },
  {
    name: "Mr. Joseph O.",
    age: "82",
    lastSeen: "Surulere",
    date: "Yesterday, 5:45 PM",
    risk: "Diabetes medication due",
    contact: "0800 000 1144",
    status: "Police notified",
  },
  {
    name: "Mrs. Grace E.",
    age: "74",
    lastSeen: "Lekki Phase 1",
    date: "Closed 2 days ago",
    risk: "Found safe",
    contact: "Case closed",
    status: "Closed",
  },
];

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

const referenceRows = [
  {
    caregiver: "T. Adewale",
    role: "Live-in caregiver",
    employer: "Verified member home",
    period: "2023 - 2026",
    rating: "Reference confirmed",
  },
  {
    caregiver: "M. Okorie",
    role: "Healthcare assistant",
    employer: "Day-care provider",
    period: "2022 - 2025",
    rating: "Good conduct record",
  },
  {
    caregiver: "S. Balogun",
    role: "Nurse aide",
    employer: "Residential care facility",
    period: "2021 - 2024",
    rating: "Licence checked",
  },
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
  "Consent-led records",
  "RLS-first database",
  "Restricted incident access",
];

const statusStats = [
  { value: 3, label: "elder alerts" },
  { value: 128, label: "member records" },
  { value: 412, label: "reference checks" },
  { value: 24, label: "pending reviews" },
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
          <img src="/logo.svg" alt="" className="brand-mark" />
          <span>
            <strong>APEC Lagos</strong>
            <small>Association of Providers of Elderly Care</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#missing-elders">Missing Elders</a>
          <a href="#caregiver-register">Caregiver Register</a>
          <a href="#vetting">Vetting</a>
          <a href="#membership">Membership</a>
        </nav>
        <a className="header-action" href="/portal">
          Open Portal
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
            board-ready platform for Lagos State care providers.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#membership">
              View Platform
            </a>
            <a className="secondary-button" href="#caregiver-register">
              Review Registers
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
            <span>Executive Safeguarding Console</span>
            <strong>Live</strong>
          </div>
          <div className="case-spotlight">
            <span>Priority watch</span>
            <b>2 high-risk elder alerts need officer review</b>
            <small>Last updated from the secure operations queue</small>
          </div>
          <StatGrid stats={statusStats} />
          <div className="priority-list">
            <div>
              <b>Consent queue</b>
              <span>7 caregiver records awaiting signed consent</span>
            </div>
            <div>
              <b>Documents</b>
              <span>Police certificate and licence uploads due this week</span>
            </div>
            <div>
              <b>Announcements</b>
              <span>Quarterly care home meeting draft ready for approval</span>
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
        <div className="registry-layout">
          <div className="elder-board">
            {missingElders.map((elder) => (
              <article className="elder-card" key={elder.name}>
                <div className="missing-photo">
                  <AppIcon name="photo" />
                  <span>Last photo</span>
                </div>
                <div>
                  <div className="card-topline">
                    <h3>{elder.name}</h3>
                    <span>{elder.status}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Age</dt>
                      <dd>{elder.age}</dd>
                    </div>
                    <div>
                      <dt>Last seen</dt>
                      <dd>{elder.lastSeen}</dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>{elder.date}</dd>
                    </div>
                    <div>
                      <dt>Risk note</dt>
                      <dd>{elder.risk}</dd>
                    </div>
                    <div>
                      <dt>If found call</dt>
                      <dd>{elder.contact}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            ))}
          </div>
          <form className="intake-form">
            <h3>Alert intake</h3>
            <label>
              Elder&apos;s full name
              <input placeholder="Name to be reviewed" />
            </label>
            <label>
              Last known photo
              <input type="file" accept="image/png,image/jpeg,image/webp" />
            </label>
            <label>
              Last seen location
              <input placeholder="Street, LGA, landmark" />
            </label>
            <label>
              Contact number if found
              <input placeholder="Family or reporting officer number" />
            </label>
            <label>
              Safeguarding notes
              <textarea placeholder="Medical risks, clothing, police reference" />
            </label>
            <button type="button">Submit for Review</button>
          </form>
        </div>
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
              <h3>Reference Register</h3>
              <span>Consent verified</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Caregiver</th>
                  <th>Role</th>
                  <th>Period</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {referenceRows.map((row) => (
                  <tr key={row.caregiver}>
                    <td>
                      <b>{row.caregiver}</b>
                      <small>{row.employer}</small>
                    </td>
                    <td>{row.role}</td>
                    <td>{row.period}</td>
                    <td>{row.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="incident-panel">
            <h3>Safeguarding Incident Register</h3>
            <p>
              This replaces a casual blacklist with a controlled Do Not Rehire
              and incident review workflow.
            </p>
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

      <section className="workspace-band membership" id="membership">
        <div className="section-heading">
          <span>Association operations</span>
          <h2>Membership and Admin Portal</h2>
          <p>
            The first build keeps the association usable immediately, then
            connects Supabase authentication, storage, and database policies in
            the next layer.
          </p>
        </div>
        <div className="portal-grid">
          <a href="/portal">
            <h3>Member Dashboard</h3>
            <p>
              Membership status, renewal due date, profile summary,
              announcements, documents, and password management.
            </p>
            <span>Member, pending member</span>
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
            <h3>Supabase Tables</h3>
            <p>
              users, members, categories, announcements, documents, renewals,
              missing elder cases, caregiver references, and incident reviews.
            </p>
            <span>Database layer connected</span>
          </a>
        </div>
      </section>

      <footer>
        <div className="footer-icon-strip" aria-hidden="true">
          <span><AppIcon name="members" /></span>
          <span><AppIcon name="missing" /></span>
          <span><AppIcon name="phone" /></span>
        </div>
        <img src="/logo.svg" alt="" />
        <span>
          APEC Lagos. Built for elderly care membership, coordination, and
          safeguarding.
        </span>
      </footer>
    </main>
  );
}
