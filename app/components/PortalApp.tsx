"use client";

import { useEffect, useMemo, useState } from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
  type Announcement,
  type MemberOrganization,
  type MembershipCategory,
  type MissingElderCase,
  type Profile,
} from "../../lib/supabase/client";

type Mode = "sign-in" | "register";

type Notice = {
  tone: "info" | "success" | "error";
  text: string;
};

const roleLabels: Record<Profile["role"], string> = {
  super_admin: "Super Admin",
  secretary_admin: "Secretary/Admin",
  committee_member: "Committee Member",
  member: "Member",
  pending_member: "Pending Member",
};

function getErrorMessage(error: unknown) {
  if ((error as AuthError | null)?.message) {
    return (error as AuthError).message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function PortalApp() {
  const configured = hasSupabaseConfig();
  const supabase = useMemo(
    () => (configured ? createBrowserSupabaseClient() : null),
    [configured],
  );

  const [mode, setMode] = useState<Mode>("sign-in");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [categories, setCategories] = useState<MembershipCategory[]>([]);
  const [organizations, setOrganizations] = useState<MemberOrganization[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [missingCases, setMissingCases] = useState<MissingElderCase[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!supabase) {
      setBooting(false);
      return;
    }

    let active = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setUser(data.session?.user ?? null);
      setBooting(false);
    };

    void loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) {
      setProfile(null);
      setOrganizations([]);
      return;
    }

    const loadPrivateData = async () => {
      const [profileResult, organizationsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,email,full_name,phone,role,status")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("member_organizations")
          .select("id,name,membership_number,contact_person,phone,email,lga,status,renewal_due_date")
          .order("created_at", { ascending: false }),
      ]);

      if (profileResult.error) {
        setNotice({ tone: "error", text: profileResult.error.message });
      } else {
        setProfile(profileResult.data as Profile | null);
      }

      if (!organizationsResult.error) {
        setOrganizations((organizationsResult.data ?? []) as MemberOrganization[]);
      }
    };

    void loadPrivateData();
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase) return;

    const loadPublicData = async () => {
      const [categoriesResult, announcementsResult, missingResult] =
        await Promise.all([
          supabase
            .from("membership_categories")
            .select("id,name,description,annual_dues,is_active")
            .eq("is_active", true)
            .order("name"),
          supabase
            .from("announcements")
            .select("id,title,body,target_audience,is_pinned,is_urgent,publish_at")
            .order("publish_at", { ascending: false })
            .limit(5),
          supabase
            .from("missing_elder_cases")
            .select("id,public_reference,elder_name,approximate_age,photo_path,last_seen_location,last_seen_at,public_notes,police_reference,status,published_at")
            .order("published_at", { ascending: false })
            .limit(5),
        ]);

      if (!categoriesResult.error) {
        setCategories((categoriesResult.data ?? []) as MembershipCategory[]);
      }

      if (!announcementsResult.error) {
        setAnnouncements((announcementsResult.data ?? []) as Announcement[]);
      }

      if (!missingResult.error) {
        setMissingCases((missingResult.data ?? []) as MissingElderCase[]);
      }
    };

    void loadPublicData();
  }, [supabase]);

  const isStaff =
    profile?.role === "super_admin" ||
    profile?.role === "secretary_admin" ||
    profile?.role === "committee_member";

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "");

    setLoading(true);
    setNotice(null);

    const result =
      mode === "register"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (result.error) {
      setNotice({ tone: "error", text: result.error.message });
      return;
    }

    setNotice({
      tone: "success",
      text:
        mode === "register"
          ? "Account created. Check your email if verification is enabled."
          : "Signed in successfully.",
    });
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setNotice({ tone: "info", text: "Signed out." });
  }

  async function handleMemberApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;

    const formData = new FormData(event.currentTarget);
    const categoryId = String(formData.get("categoryId") ?? "") || null;

    setLoading(true);
    setNotice(null);

    const { error } = await supabase.from("member_organizations").insert({
      name: String(formData.get("name") ?? ""),
      category_id: categoryId,
      contact_person: String(formData.get("contactPerson") ?? ""),
      position_title: String(formData.get("positionTitle") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? user.email ?? ""),
      lga: String(formData.get("lga") ?? ""),
      address: String(formData.get("address") ?? ""),
      created_by: user.id,
    });

    setLoading(false);

    if (error) {
      setNotice({ tone: "error", text: error.message });
      return;
    }

    event.currentTarget.reset();
    setNotice({
      tone: "success",
      text: "Membership application submitted for admin review.",
    });
  }

  async function handleMissingElder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;

    const formData = new FormData(event.currentTarget);
    const reference = `APEC-ME-${Date.now().toString().slice(-8)}`;
    const age = Number(formData.get("age"));

    setLoading(true);
    setNotice(null);

    try {
      const { data: caseRow, error: caseError } = await supabase
        .from("missing_elder_cases")
        .insert({
          public_reference: reference,
          elder_name: String(formData.get("elderName") ?? ""),
          approximate_age: Number.isFinite(age) ? age : null,
          last_seen_location: String(formData.get("lastSeenLocation") ?? ""),
          public_notes: String(formData.get("publicNotes") ?? ""),
          status: "pending_review",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (caseError) throw caseError;

      const { error: detailsError } = await supabase
        .from("missing_elder_private_details")
        .insert({
          case_id: caseRow.id,
          family_contact_name: String(formData.get("contactName") ?? ""),
          family_contact_phone: String(formData.get("contactPhone") ?? ""),
          medical_risks: String(formData.get("medicalRisks") ?? ""),
        });

      if (detailsError) throw detailsError;

      event.currentTarget.reset();
      setNotice({
        tone: "success",
        text: "Missing elder alert submitted for safeguarding review.",
      });
    } catch (error) {
      setNotice({ tone: "error", text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-shell">
      <header className="portal-header">
        <a className="brand-lockup" href="/" aria-label="Back to APEC Lagos home">
          <img src="/logo.svg" alt="" className="brand-mark" />
          <span>
            <strong>APEC Lagos</strong>
            <small>Secure member portal</small>
          </span>
        </a>
        <nav aria-label="Portal navigation">
          <a href="/">Public Site</a>
          <a href="#membership-application">Membership</a>
          <a href="#missing-intake">Missing Elders</a>
        </nav>
        {user ? (
          <button className="portal-ghost-button" type="button" onClick={handleSignOut}>
            Sign Out
          </button>
        ) : null}
      </header>

      <section className="portal-hero">
        <div>
          <span className="eyebrow">Phase 2 app layer</span>
          <h1>Member access, applications, and safeguarding intake.</h1>
          <p>
            This portal connects the APEC Lagos platform to Supabase Auth,
            member records, public announcements, missing elder cases, and
            admin-controlled review workflows.
          </p>
        </div>
        <div className="portal-status-panel">
          <b>{configured ? "Supabase project connected" : "Supabase key needed"}</b>
          <span>
            {configured
              ? "Authentication and database reads are ready."
              : "Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable live login."}
          </span>
        </div>
      </section>

      {notice ? <div className={`portal-notice ${notice.tone}`}>{notice.text}</div> : null}

      {!configured ? (
        <section className="portal-card">
          <h2>Connect Supabase</h2>
          <p>
            The project URL is already set. Add the publishable key from
            Supabase Project Settings to `.env.local` or Vercel environment
            variables, then restart the app.
          </p>
        </section>
      ) : booting ? (
        <section className="portal-card">
          <h2>Loading portal</h2>
          <p>Checking the current Supabase session.</p>
        </section>
      ) : user ? (
        <>
          <section className="portal-grid-layout">
            <article className="portal-card">
              <span className="portal-kicker">Signed in</span>
              <h2>{profile?.full_name || user.email}</h2>
              <dl className="portal-details">
                <div>
                  <dt>Status</dt>
                  <dd>{profile?.status ?? "Pending profile"}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{profile ? roleLabels[profile.role] : "Pending Member"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
              </dl>
            </article>

            <article className="portal-card">
              <span className="portal-kicker">Dashboard</span>
              <h2>{isStaff ? "Admin Desk" : "Member Dashboard"}</h2>
              <p>
                {isStaff
                  ? "Review applications, missing elder alerts, caregiver references, documents, renewals, and audit activity."
                  : "Track your membership status, applications, announcements, documents, and renewal information."}
              </p>
            </article>
          </section>

          <section className="portal-card" id="membership-application">
            <div className="portal-section-head">
              <div>
                <span className="portal-kicker">Membership</span>
                <h2>Organisation Application</h2>
              </div>
              <span>{organizations.length} records visible</span>
            </div>
            <form className="portal-form" onSubmit={handleMemberApplication}>
              <label>
                Organisation name
                <input name="name" required placeholder="Registered care provider name" />
              </label>
              <label>
                Membership category
                <select name="categoryId">
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Contact person
                <input name="contactPerson" required placeholder="Primary contact" />
              </label>
              <label>
                Position
                <input name="positionTitle" placeholder="Director, manager, matron" />
              </label>
              <label>
                Phone
                <input name="phone" required placeholder="080..." />
              </label>
              <label>
                Email
                <input name="email" type="email" defaultValue={user.email ?? ""} />
              </label>
              <label>
                LGA
                <input name="lga" placeholder="Ikeja, Surulere, Lekki..." />
              </label>
              <label className="span-2">
                Address
                <textarea name="address" placeholder="Facility or office address" />
              </label>
              <button type="submit" disabled={loading}>
                Submit Application
              </button>
            </form>
          </section>

          <section className="portal-card" id="missing-intake">
            <div className="portal-section-head">
              <div>
                <span className="portal-kicker">Public safeguarding</span>
                <h2>Missing Elder Intake</h2>
              </div>
              <span>Private details restricted to staff</span>
            </div>
            <form className="portal-form" onSubmit={handleMissingElder}>
              <label>
                Elder&apos;s full name
                <input name="elderName" required placeholder="Name for review" />
              </label>
              <label>
                Approximate age
                <input name="age" type="number" min="50" max="120" placeholder="78" />
              </label>
              <label className="span-2">
                Last seen location
                <input name="lastSeenLocation" required placeholder="Street, LGA, landmark" />
              </label>
              <label>
                Contact name
                <input name="contactName" required placeholder="Family or officer" />
              </label>
              <label>
                Contact number if found
                <input name="contactPhone" required placeholder="080..." />
              </label>
              <label className="span-2">
                Public notes
                <textarea name="publicNotes" placeholder="Clothing, safe approach guidance, public description" />
              </label>
              <label className="span-2">
                Medical risks
                <textarea name="medicalRisks" placeholder="Private safeguarding details for reviewers" />
              </label>
              <button type="submit" disabled={loading}>
                Submit Alert
              </button>
            </form>
          </section>
        </>
      ) : (
        <section className="auth-layout">
          <form className="auth-card" onSubmit={handleAuth}>
            <span className="portal-kicker">Secure access</span>
            <h2>{mode === "sign-in" ? "Sign in to the portal" : "Create member account"}</h2>
            {mode === "register" ? (
              <label>
                Full name
                <input name="fullName" required placeholder="Your name" />
              </label>
            ) : null}
            <label>
              Email
              <input name="email" type="email" required placeholder="you@example.com" />
            </label>
            <label>
              Password
              <input name="password" type="password" required minLength={6} />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Please wait" : mode === "sign-in" ? "Sign In" : "Register"}
            </button>
            <button
              className="text-button"
              type="button"
              onClick={() => setMode(mode === "sign-in" ? "register" : "sign-in")}
            >
              {mode === "sign-in"
                ? "Need an account? Register"
                : "Already registered? Sign in"}
            </button>
          </form>

          <aside className="portal-card">
            <span className="portal-kicker">What opens next</span>
            <h2>Role-based access</h2>
            <p>
              New users start as pending members. After approval, admins can
              activate the profile and assign member, committee, secretary, or
              super admin access.
            </p>
          </aside>
        </section>
      )}

      <section className="portal-grid-layout">
        <article className="portal-card">
          <div className="portal-section-head">
            <h2>Announcements</h2>
            <span>{announcements.length}</span>
          </div>
          <div className="portal-list">
            {announcements.length ? (
              announcements.map((announcement) => (
                <div key={announcement.id}>
                  <b>{announcement.title}</b>
                  <span>{announcement.body}</span>
                </div>
              ))
            ) : (
              <p>No announcements are visible yet.</p>
            )}
          </div>
        </article>

        <article className="portal-card">
          <div className="portal-section-head">
            <h2>Missing Elder Alerts</h2>
            <span>{missingCases.length}</span>
          </div>
          <div className="portal-list">
            {missingCases.length ? (
              missingCases.map((caseItem) => (
                <div key={caseItem.id}>
                  <b>{caseItem.elder_name}</b>
                  <span>
                    {caseItem.last_seen_location} - {formatDate(caseItem.last_seen_at)}
                  </span>
                </div>
              ))
            ) : (
              <p>No public alerts are active yet.</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
