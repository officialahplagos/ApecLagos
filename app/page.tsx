const missingElders = [
  {
    name: "Mrs. Abimbola A.",
    age: "78",
    lastSeen: "Ikeja GRA",
    date: "Today, 7:30 AM",
    risk: "Memory loss",
    status: "Active alert",
  },
  {
    name: "Mr. Joseph O.",
    age: "82",
    lastSeen: "Surulere",
    date: "Yesterday, 5:45 PM",
    risk: "Diabetes medication due",
    status: "Police notified",
  },
  {
    name: "Mrs. Grace E.",
    age: "74",
    lastSeen: "Lekki Phase 1",
    date: "Closed 2 days ago",
    risk: "Found safe",
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
  },
  {
    title: "Admin Desk",
    text: "Approvals, member records, document uploads, renewal tracking, and audit logs.",
  },
  {
    title: "Missing Elders",
    text: "Moderated alerts for missing elderly persons with found and closed case tracking.",
  },
  {
    title: "Caregiver Registers",
    text: "Reference checks, consent records, vetting progress, and restricted safeguarding incidents.",
  },
];

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
        <a className="header-action" href="#missing-elders">
          Report Alert
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-content">
          <div className="eyebrow">Elderly care association platform</div>
          <h1>APEC Lagos member and safeguarding system</h1>
          <p>
            A professional web app for elderly care providers in Lagos State to
            manage membership, share trusted notices, verify caregiver history,
            and coordinate safeguarding action.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#membership">
              View Member System
            </a>
            <a className="secondary-button" href="#caregiver-register">
              Review Registers
            </a>
          </div>
        </div>
        <div className="command-panel" aria-label="APEC platform overview">
          <div className="panel-header">
            <span>Today&apos;s Safeguarding Desk</span>
            <strong>Live shell</strong>
          </div>
          <div className="status-grid">
            <div>
              <strong>3</strong>
              <span>elder alerts</span>
            </div>
            <div>
              <strong>128</strong>
              <span>member records</span>
            </div>
            <div>
              <strong>412</strong>
              <span>reference checks</span>
            </div>
            <div>
              <strong>24</strong>
              <span>pending reviews</span>
            </div>
          </div>
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
                <div className="avatar">{elder.name.slice(0, 1)}</div>
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
              Last seen location
              <input placeholder="Street, LGA, landmark" />
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

      <section className="workspace-band" id="vetting">
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
          <article>
            <h3>Member Dashboard</h3>
            <p>
              Membership status, renewal due date, profile summary,
              announcements, documents, and password management.
            </p>
            <span>Member, pending member</span>
          </article>
          <article>
            <h3>Admin Dashboard</h3>
            <p>
              Approvals, member search, document upload, renewal tracking,
              announcements, exports, and audit trail.
            </p>
            <span>Secretary, admin, super admin</span>
          </article>
          <article>
            <h3>Supabase Tables</h3>
            <p>
              users, members, categories, announcements, documents, renewals,
              missing elder cases, caregiver references, and incident reviews.
            </p>
            <span>Database layer next</span>
          </article>
        </div>
      </section>

      <footer>
        <img src="/logo.svg" alt="" />
        <span>
          APEC Lagos. Built for elderly care membership, coordination, and
          safeguarding.
        </span>
      </footer>
    </main>
  );
}
