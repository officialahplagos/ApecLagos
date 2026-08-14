"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FunctionsHttpError, type AuthError, type User } from "@supabase/supabase-js";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
  type Announcement,
  type CaregiverEmploymentReference,
  type CaregiverProfile,
  type MemberOrganization,
  type MembershipApplication,
  type MissingElderCase,
  type Profile,
} from "../../lib/supabase/client";

type Notice = {
  tone: "info" | "success" | "error";
  text: string;
};

type ManualInvitation = {
  email: string;
  link: string;
};

const roleLabels: Record<Profile["role"], string> = {
  super_admin: "Super Admin",
  secretary_admin: "Secretary/Admin",
  compliance_officer: "Compliance Officer",
  committee_member: "Committee Member",
  member: "Member",
  pending_member: "Pending Member",
};

const roleOptions: Profile["role"][] = [
  "pending_member",
  "member",
  "compliance_officer",
  "committee_member",
  "secretary_admin",
  "super_admin",
];

const sampleAnnouncements: Announcement[] = [
  {
    id: "sample-announcement-001",
    title: "SAMPLE: Member briefing draft",
    body: "Fictional sample announcement showing how approved member notices will appear in the portal.",
    target_audience: "members",
    is_pinned: true,
    is_urgent: false,
    publish_at: "2026-07-29T00:00:00.000Z",
  },
  {
    id: "sample-announcement-002",
    title: "SAMPLE: Renewal reminder",
    body: "Fictional reminder for demonstrating renewal and document workflows before launch.",
    target_audience: "members",
    is_pinned: false,
    is_urgent: false,
    publish_at: "2026-07-29T00:00:00.000Z",
  },
];

const sampleMissingCases: MissingElderCase[] = [
  {
    id: "sample-missing-001",
    public_reference: "SAMPLE-ME-001",
    elder_name: "Case Sample 001",
    approximate_age: 78,
    photo_path: null,
    last_seen_location: "Sample Lagos location A",
    last_seen_at: "2026-07-29T07:30:00.000Z",
    public_notes: "SAMPLE: fictional public alert preview. If found call +234 000 000 0000.",
    police_reference: "SAMPLE-REF",
    status: "active",
    published_at: "2026-07-29T08:00:00.000Z",
  },
  {
    id: "sample-missing-002",
    public_reference: "SAMPLE-ME-002",
    elder_name: "Case Sample 002",
    approximate_age: 82,
    photo_path: null,
    last_seen_location: "Sample Lagos location B",
    last_seen_at: "2026-07-28T17:45:00.000Z",
    public_notes: "SAMPLE: fictional police-notified alert for demo review.",
    police_reference: "SAMPLE-REF",
    status: "active",
    published_at: "2026-07-29T08:05:00.000Z",
  },
];

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

function cleanOptional(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function buildMedicalRisks(formData: FormData) {
  const selectedConditions = formData
    .getAll("medicalConditions")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const otherDetails = cleanOptional(formData.get("medicalRisksOther"));

  if (otherDetails) {
    selectedConditions.push(`Other details: ${otherDetails}`);
  }

  return selectedConditions.length ? selectedConditions.join("; ") : null;
}

function buildReference(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-8)}`;
}

export function PortalApp() {
  const configured = hasSupabaseConfig();
  const supabase = useMemo(
    () => (configured ? createBrowserSupabaseClient() : null),
    [configured],
  );

  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<MemberOrganization[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [missingCases, setMissingCases] = useState<MissingElderCase[]>([]);
  const [membershipApplications, setMembershipApplications] = useState<
    MembershipApplication[]
  >([]);
  const [reviewCases, setReviewCases] = useState<MissingElderCase[]>([]);
  const [caregivers, setCaregivers] = useState<CaregiverProfile[]>([]);
  const [caregiverReferences, setCaregiverReferences] = useState<
    CaregiverEmploymentReference[]
  >([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [passwordSetup, setPasswordSetup] = useState(false);
  const [editingApplicationId, setEditingApplicationId] = useState<string | null>(null);
  const [membershipActionId, setMembershipActionId] = useState<string | null>(null);
  const [manualInvitation, setManualInvitation] = useState<ManualInvitation | null>(null);

  const isStaff =
    profile?.role === "super_admin" ||
    profile?.role === "secretary_admin" ||
    profile?.role === "compliance_officer" ||
    profile?.role === "committee_member";

  const isAdmin = profile?.role === "super_admin" || profile?.role === "secretary_admin";
  const canReviewMembership =
    profile?.role === "super_admin" ||
    profile?.role === "secretary_admin" ||
    profile?.role === "compliance_officer";
  const visibleAnnouncements = announcements.length ? announcements : sampleAnnouncements;
  const visibleMissingCases = missingCases.length ? missingCases : sampleMissingCases;
  const usingSampleAnnouncements = announcements.length === 0;
  const usingSampleMissingCases = missingCases.length === 0;

  const refreshPublicData = useCallback(async () => {
    if (!supabase) return;

    const [announcementsResult, missingResult] = await Promise.all([
      supabase
        .from("announcements")
        .select("id,title,body,target_audience,is_pinned,is_urgent,publish_at")
        .order("publish_at", { ascending: false })
        .limit(5),
      supabase
        .from("missing_elder_cases")
        .select(
          "id,public_reference,elder_name,approximate_age,photo_path,last_seen_location,last_seen_at,public_notes,police_reference,status,published_at",
        )
        .order("published_at", { ascending: false })
        .limit(6),
    ]);

    if (!announcementsResult.error) {
      setAnnouncements((announcementsResult.data ?? []) as Announcement[]);
    }

    if (!missingResult.error) {
      setMissingCases((missingResult.data ?? []) as MissingElderCase[]);
    }
  }, [supabase]);

  const refreshPrivateData = useCallback(async () => {
    if (!supabase || !user) {
      setProfile(null);
      setOrganizations([]);
      return;
    }

    const [profileResult, organizationsResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,email,full_name,phone,role,status")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("member_organizations")
        .select(
          "id,name,membership_number,contact_person,phone,email,lga,status,renewal_due_date",
        )
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
  }, [supabase, user]);

  const refreshStaffData = useCallback(async () => {
    if (!supabase || !isStaff) {
      setMembershipApplications([]);
      setReviewCases([]);
      setCaregivers([]);
      setCaregiverReferences([]);
      setProfiles([]);
      return;
    }

    const [
      applicationsResult,
      casesResult,
      caregiversResult,
      referencesResult,
      profilesResult,
    ] = await Promise.all([
      supabase
        .from("membership_applications")
        .select(
          "id,application_reference,organization_name,membership_category_id,contact_full_name,position_title,email,phone,lga,address,registration_number,year_established,services_offered,status,review_notes,created_at",
        )
        .in("status", ["pending", "under_review"])
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("missing_elder_cases")
        .select(
          "id,public_reference,elder_name,approximate_age,photo_path,last_seen_location,last_seen_at,public_notes,police_reference,status,published_at",
        )
        .in("status", ["pending_review", "active"])
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("caregiver_profiles")
        .select("id,legal_name,phone,email,nin_last4,bvn_last4,consent_obtained,status,created_at")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("caregiver_employment_references")
        .select(
          "id,caregiver_id,role_title,supervisor_name,supervisor_contact,conduct_summary,rehire_eligible,consent_verified,verification_status",
        )
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("profiles")
        .select("id,email,full_name,phone,role,status")
        .order("email")
        .limit(24),
    ]);

    if (!applicationsResult.error) {
      setMembershipApplications(
        (applicationsResult.data ?? []) as MembershipApplication[],
      );
    }

    if (!casesResult.error) {
      setReviewCases((casesResult.data ?? []) as MissingElderCase[]);
    }

    if (!caregiversResult.error) {
      setCaregivers((caregiversResult.data ?? []) as CaregiverProfile[]);
    }

    if (!referencesResult.error) {
      setCaregiverReferences(
        (referencesResult.data ?? []) as CaregiverEmploymentReference[],
      );
    }

    if (!profilesResult.error) {
      setProfiles((profilesResult.data ?? []) as Profile[]);
    }
  }, [isStaff, supabase]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const authType = hash.get("type");

    if (
      query.get("invited") === "1" ||
      authType === "invite" ||
      authType === "recovery"
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPasswordSetup(true);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshPrivateData();
  }, [refreshPrivateData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshPublicData();
  }, [refreshPublicData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshStaffData();
  }, [refreshStaffData]);

  function getPhotoUrl(photoPath: string | null) {
    if (!supabase || !photoPath) return null;
    return supabase.storage.from("missing-elder-photos").getPublicUrl(photoPath).data
      .publicUrl;
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setLoading(true);
    setNotice(null);

    const result = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (result.error) {
      setNotice({ tone: "error", text: result.error.message });
      return;
    }

    setNotice({
      tone: "success",
      text: "Signed in successfully.",
    });
  }

  async function handlePasswordSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");

    if (password !== confirmation) {
      setNotice({ tone: "error", text: "The passwords do not match." });
      return;
    }

    setLoading(true);
    setNotice(null);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setNotice({ tone: "error", text: error.message });
      return;
    }

    setPasswordSetup(false);
    window.history.replaceState({}, "", "/portal");
    setNotice({ tone: "success", text: "Your portal password is ready." });
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setNotice({ tone: "info", text: "Signed out." });
  }

  async function handleClaimFirstAdmin() {
    if (!supabase) return;

    setLoading(true);
    setNotice(null);

    const { error } = await supabase.rpc("claim_first_admin");

    setLoading(false);

    if (error) {
      setNotice({ tone: "error", text: error.message });
      return;
    }

    await refreshPrivateData();
    setNotice({
      tone: "success",
      text: "First admin account activated for this Supabase project.",
    });
  }

  async function handleMissingElder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;

    const formData = new FormData(event.currentTarget);
    const reference = buildReference("APEC-ME");
    const age = Number(formData.get("age"));
    const photo = formData.get("photo");
    let photoPath: string | null = null;

    setLoading(true);
    setNotice(null);

    try {
      if (photo instanceof File && photo.size > 0) {
        const rawExtension = photo.name.split(".").pop()?.toLowerCase();
        const extension = ["jpg", "jpeg", "png", "webp"].includes(rawExtension ?? "")
          ? rawExtension
          : "jpg";
        photoPath = `${user.id}/missing-elders/${reference}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("missing-elder-photos")
          .upload(photoPath, photo, {
            contentType: photo.type || "image/jpeg",
            upsert: false,
          });

        if (uploadError) throw uploadError;
      }

      const { data: caseRow, error: caseError } = await supabase
        .from("missing_elder_cases")
        .insert({
          public_reference: reference,
          elder_name: String(formData.get("elderName") ?? ""),
          approximate_age: Number.isFinite(age) ? age : null,
          photo_path: photoPath,
          last_seen_location: String(formData.get("lastSeenLocation") ?? ""),
          last_seen_at: cleanOptional(formData.get("lastSeenAt")),
          public_notes: cleanOptional(formData.get("publicNotes")),
          police_reference: cleanOptional(formData.get("policeReference")),
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
          submitter_name: cleanOptional(formData.get("submitterName")),
          submitter_phone: cleanOptional(formData.get("submitterPhone")),
          family_contact_name: String(formData.get("contactName") ?? ""),
          family_contact_phone: String(formData.get("contactPhone") ?? ""),
          medical_risks: buildMedicalRisks(formData),
        });

      if (detailsError) throw detailsError;

      event.currentTarget.reset();
      await refreshPublicData();
      await refreshStaffData();
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

  async function handleMembershipReview(
    application: MembershipApplication,
    decision: "approve" | "reject",
    notes: string,
  ) {
    if (!supabase) return;

    setMembershipActionId(application.id);
    setNotice(null);
    setManualInvitation(null);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setMembershipActionId(null);
      setNotice({ tone: "error", text: "Your staff session has expired. Sign in again and retry." });
      return;
    }

    const { data, error } = await supabase.functions.invoke(
      "review-membership-application",
      {
        body: {
          applicationId: application.id,
          decision,
          notes,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      },
    );

    setMembershipActionId(null);

    if (error) {
      let message = data?.error ?? error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const errorBody = await error.context.json();
          message = [errorBody?.error, errorBody?.details].filter(Boolean).join(" ") || message;
        } catch {
          // Keep the function client's fallback message when no JSON body is available.
        }
      }
      setNotice({ tone: "error", text: message });
      return;
    }

    await refreshPrivateData();
    await refreshStaffData();
    setNotice({
      tone: data?.warning ? "info" : "success",
      text: data?.message ?? `Application ${decision === "approve" ? "approved" : "rejected"}.`,
    });
    if (data?.invitationLink) {
      setManualInvitation({ email: application.email, link: data.invitationLink });
    }
  }

  async function handleMembershipApplicationUpdate(
    event: FormEvent<HTMLFormElement>,
    application: MembershipApplication,
  ) {
    event.preventDefault();
    if (!supabase) return;

    const formData = new FormData(event.currentTarget);
    const yearText = String(formData.get("yearEstablished") ?? "").trim();
    const yearEstablished = yearText ? Number(yearText) : null;

    setMembershipActionId(application.id);
    setNotice(null);

    const { error } = await supabase
      .from("membership_applications")
      .update({
        organization_name: String(formData.get("organizationName") ?? "").trim(),
        contact_full_name: String(formData.get("contactFullName") ?? "").trim(),
        position_title: cleanOptional(formData.get("positionTitle")),
        email: String(formData.get("email") ?? "").trim().toLowerCase(),
        phone: String(formData.get("phone") ?? "").trim(),
        lga: cleanOptional(formData.get("lga")),
        address: cleanOptional(formData.get("address")),
        registration_number: cleanOptional(formData.get("registrationNumber")),
        year_established: Number.isFinite(yearEstablished) ? yearEstablished : null,
        services_offered: cleanOptional(formData.get("servicesOffered")),
        status: "under_review",
      })
      .eq("id", application.id)
      .in("status", ["pending", "under_review"]);

    setMembershipActionId(null);

    if (error) {
      setNotice({ tone: "error", text: error.message });
      return;
    }

    setEditingApplicationId(null);
    await refreshStaffData();
    setNotice({ tone: "success", text: "Application changes saved for compliance review." });
  }

  async function copyInvitationLink() {
    if (!manualInvitation) return;

    try {
      await navigator.clipboard.writeText(manualInvitation.link);
      setNotice({ tone: "success", text: "Secure invitation link copied. Share it only with the approved applicant." });
    } catch {
      setNotice({ tone: "error", text: "The link could not be copied automatically. Select and copy it below." });
    }
  }

  async function handleCaseStatus(
    caseItem: MissingElderCase,
    status: MissingElderCase["status"],
  ) {
    if (!supabase || !user) return;

    setLoading(true);
    setNotice(null);

    const { error } = await supabase
      .from("missing_elder_cases")
      .update({
        status,
        published_at:
          status === "active" && !caseItem.published_at
            ? new Date().toISOString()
            : caseItem.published_at,
        reviewed_by: user.id,
      })
      .eq("id", caseItem.id);

    setLoading(false);

    if (error) {
      setNotice({ tone: "error", text: error.message });
      return;
    }

    await refreshPublicData();
    await refreshStaffData();
    setNotice({ tone: "success", text: `Missing elder case marked ${status}.` });
  }

  async function handleProfileChange(
    profileRow: Profile,
    role: Profile["role"],
    status: Profile["status"],
  ) {
    if (!supabase) return;

    setLoading(true);
    setNotice(null);

    const { error } = await supabase
      .from("profiles")
      .update({ role, status })
      .eq("id", profileRow.id);

    setLoading(false);

    if (error) {
      setNotice({ tone: "error", text: error.message });
      return;
    }

    await refreshPrivateData();
    await refreshStaffData();
    setNotice({ tone: "success", text: "User access updated." });
  }

  async function handleCaregiverReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    const formData = new FormData(event.currentTarget);

    setLoading(true);
    setNotice(null);

    try {
      const { data: caregiver, error: caregiverError } = await supabase
        .from("caregiver_profiles")
        .insert({
          legal_name: String(formData.get("legalName") ?? ""),
          phone: cleanOptional(formData.get("phone")),
          email: cleanOptional(formData.get("email")),
          nin_last4: cleanOptional(formData.get("ninLast4")),
          bvn_last4: cleanOptional(formData.get("bvnLast4")),
          consent_obtained: formData.get("consentObtained") === "on",
          status: "active",
        })
        .select("id")
        .single();

      if (caregiverError) throw caregiverError;

      const { error: referenceError } = await supabase
        .from("caregiver_employment_references")
        .insert({
          caregiver_id: caregiver.id,
          role_title: String(formData.get("roleTitle") ?? ""),
          supervisor_name: cleanOptional(formData.get("supervisorName")),
          supervisor_contact: cleanOptional(formData.get("supervisorContact")),
          conduct_summary: cleanOptional(formData.get("conductSummary")),
          rehire_eligible: formData.get("rehireEligible") === "on",
          consent_verified: formData.get("consentObtained") === "on",
          verification_status: "verified",
          verified_by: user?.id ?? null,
        });

      if (referenceError) throw referenceError;

      event.currentTarget.reset();
      await refreshStaffData();
      setNotice({
        tone: "success",
        text: "Caregiver reference added to the shared register.",
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
        <Link className="brand-lockup" href="/" aria-label="Back to APEC Lagos home">
          <img src="/logo.svg" alt="" className="brand-mark" />
          <span>
            <strong>APEC Lagos</strong>
            <small>Secure member portal</small>
          </span>
        </Link>
        <nav aria-label="Portal navigation">
          <Link href="/">Public Site</Link>
          <Link href="/apply">Apply for Membership</Link>
          <a href="#missing-intake">Missing Elders</a>
          <a href="#public-alerts">Public Alerts</a>
        </nav>
        {user ? (
          <button className="portal-ghost-button" type="button" onClick={handleSignOut}>
            Sign Out
          </button>
        ) : null}
      </header>

      <section className="portal-hero">
        <div>
          <span className="eyebrow">Board-ready demo portal</span>
          <h1>Member access, applications, and safeguarding intake.</h1>
          <p>
            This portal connects the APEC Lagos platform to Supabase Auth,
            member records, public announcements, missing elder cases, caregiver
            reference records, and admin-controlled review workflows.
          </p>
        </div>
        <div className="portal-status-panel">
          <b>{configured ? "Supabase project connected" : "Supabase key needed"}</b>
          <span>
            {configured
              ? "Authentication, database reads, and storage-backed alerts are ready."
              : "Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable live login."}
          </span>
        </div>
      </section>

      {notice ? <div className={`portal-notice ${notice.tone}`} role="status">{notice.text}</div> : null}
      {manualInvitation ? (
        <section className="manual-invitation" aria-label="Secure invitation link">
          <div>
            <b>Manual invitation for {manualInvitation.email}</b>
            <span>This single-use access link is sensitive. Share it only with the approved applicant.</span>
          </div>
          <input aria-label="Secure invitation link" value={manualInvitation.link} readOnly />
          <button type="button" onClick={copyInvitationLink}>Copy Link</button>
        </section>
      ) : null}

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
          <p>
            Checking the current Supabase session. Log in as a demo member to
            view sample records.
          </p>
        </section>
      ) : user ? (
        <>
          {passwordSetup ? (
            <section className="portal-card password-setup-card">
              <span className="portal-kicker">Complete your invitation</span>
              <h2>Set your portal password</h2>
              <p>Choose a private password for future APEC Lagos portal access.</p>
              <form className="portal-form" onSubmit={handlePasswordSetup}>
                <label>
                  New password
                  <input name="password" type="password" required minLength={8} autoComplete="new-password" />
                </label>
                <label>
                  Confirm password
                  <input name="confirmation" type="password" required minLength={8} autoComplete="new-password" />
                </label>
                <button type="submit" disabled={loading}>
                  {loading ? "Saving password..." : "Set Password"}
                </button>
              </form>
            </section>
          ) : null}

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
                  ? "Review applications, publish missing elder alerts, maintain caregiver references, and manage user access."
                  : "Track your membership status, applications, announcements, and safeguarding submissions."}
              </p>
              {!isStaff ? (
                <button
                  className="portal-secondary-button"
                  type="button"
                  onClick={handleClaimFirstAdmin}
                  disabled={loading}
                >
                  Claim First Admin
                </button>
              ) : null}
            </article>
          </section>

          {isStaff ? (
            <section className="portal-admin-stack" aria-label="Admin workflows">
              {canReviewMembership ? <section className="portal-card">
                <div className="portal-section-head">
                  <div>
                    <span className="portal-kicker">Compliance review</span>
                    <h2>Membership Applications</h2>
                  </div>
                  <span>{membershipApplications.length} awaiting review</span>
                </div>
                <div className="portal-list">
                  {membershipApplications.length ? (
                    membershipApplications.map((application) => {
                      const isEditing = editingApplicationId === application.id;
                      const isWorking = membershipActionId === application.id;
                      return <form
                        className="portal-row-card membership-review-card"
                        key={application.id}
                        onSubmit={(event) => {
                          if (isEditing) void handleMembershipApplicationUpdate(event, application);
                          else event.preventDefault();
                        }}
                      >
                        <div className="membership-review-head">
                          <span>
                            <b>{application.organization_name}</b>
                            <small>{application.application_reference} · submitted {formatDate(application.created_at)}</small>
                          </span>
                          <span className="review-status">{application.status.replace("_", " ")}</span>
                        </div>
                        {isEditing ? (
                          <div className="membership-edit-fields">
                            <label>Organisation name<input name="organizationName" defaultValue={application.organization_name} required minLength={2} /></label>
                            <label>Contact name<input name="contactFullName" defaultValue={application.contact_full_name} required minLength={2} /></label>
                            <label>Position<input name="positionTitle" defaultValue={application.position_title ?? ""} /></label>
                            <label>Email<input name="email" type="email" defaultValue={application.email} required /></label>
                            <label>Phone<input name="phone" type="tel" defaultValue={application.phone} required minLength={7} /></label>
                            <label>LGA<input name="lga" defaultValue={application.lga ?? ""} /></label>
                            <label>Registration number<input name="registrationNumber" defaultValue={application.registration_number ?? ""} /></label>
                            <label>Year established<input name="yearEstablished" type="number" min="1900" max="2100" defaultValue={application.year_established ?? ""} /></label>
                            <label className="span-2">Address<textarea name="address" defaultValue={application.address ?? ""} /></label>
                            <label className="span-2">Services offered<textarea name="servicesOffered" defaultValue={application.services_offered ?? ""} /></label>
                          </div>
                        ) : <><dl className="membership-review-details">
                          <div><dt>Contact</dt><dd>{application.contact_full_name}</dd></div>
                          <div><dt>Position</dt><dd>{application.position_title || "Not supplied"}</dd></div>
                          <div><dt>Email</dt><dd><a href={`mailto:${application.email}`}>{application.email}</a></dd></div>
                          <div><dt>Phone</dt><dd><a href={`tel:${application.phone}`}>{application.phone}</a></dd></div>
                          <div><dt>LGA</dt><dd>{application.lga || "Not supplied"}</dd></div>
                          <div><dt>Registration</dt><dd>{application.registration_number || "Not supplied"}</dd></div>
                        </dl>
                        {application.address ? <p><b>Address:</b> {application.address}</p> : null}
                        {application.services_offered ? <p><b>Services:</b> {application.services_offered}</p> : null}</>}
                        {!isEditing ? <label className="review-notes">
                          Review notes
                          <textarea name="reviewNotes" placeholder="Optional internal compliance note" />
                        </label> : null}
                        <div className="portal-actions membership-review-actions">
                          {isEditing ? <>
                            <button type="submit" disabled={isWorking}>{isWorking ? "Saving..." : "Save Changes"}</button>
                            <button className="portal-secondary-button" type="button" onClick={() => setEditingApplicationId(null)} disabled={isWorking}>Cancel</button>
                          </> : <>
                            <button className="portal-secondary-button" type="button" onClick={() => setEditingApplicationId(application.id)} disabled={Boolean(membershipActionId)}>Edit Application</button>
                            <button
                            type="button"
                            onClick={(event) => {
                              const form = event.currentTarget.closest("form");
                              const notes = form
                                ? String(new FormData(form).get("reviewNotes") ?? "")
                                : "";
                              void handleMembershipReview(application, "approve", notes);
                            }}
                            disabled={Boolean(membershipActionId)}
                          >
                            {isWorking ? "Approving..." : "Approve & Send Invitation"}
                          </button>
                          <button
                            className="danger-button"
                            type="button"
                            onClick={(event) => {
                              const form = event.currentTarget.closest("form");
                              const notes = form
                                ? String(new FormData(form).get("reviewNotes") ?? "")
                                : "";
                              void handleMembershipReview(application, "reject", notes);
                            }}
                            disabled={Boolean(membershipActionId)}
                          >
                            {isWorking ? "Working..." : "Reject"}
                          </button></>}
                        </div>
                      </form>
                    })
                  ) : (
                    <p>No member applications are waiting for review.</p>
                  )}
                </div>
              </section> : null}

              <section className="portal-card">
                <div className="portal-section-head">
                  <div>
                    <span className="portal-kicker">Safeguarding desk</span>
                    <h2>Missing Elder Review</h2>
                  </div>
                  <span>{reviewCases.length} open</span>
                </div>
                <div className="portal-list">
                  {reviewCases.length ? (
                    reviewCases.map((caseItem) => {
                      const photoUrl = getPhotoUrl(caseItem.photo_path);
                      return (
                        <div className="portal-row-card with-photo" key={caseItem.id}>
                          {photoUrl ? (
                            <img
                              className="case-photo-thumb"
                              src={photoUrl}
                              alt={`Last known photo for ${caseItem.elder_name}`}
                            />
                          ) : (
                            <span className="case-photo-thumb placeholder">No Photo</span>
                          )}
                          <span>
                            <b>{caseItem.elder_name}</b>
                            <small>
                              {caseItem.public_reference} - {caseItem.last_seen_location}
                            </small>
                          </span>
                          <div className="portal-actions">
                            <button
                              type="button"
                              onClick={() => handleCaseStatus(caseItem, "active")}
                              disabled={loading || caseItem.status === "active"}
                            >
                              Publish
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCaseStatus(caseItem, "found")}
                              disabled={loading}
                            >
                              Found
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCaseStatus(caseItem, "closed")}
                              disabled={loading}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p>No missing elder alerts are waiting for review.</p>
                  )}
                </div>
              </section>

              <section className="portal-card">
                <div className="portal-section-head">
                  <div>
                    <span className="portal-kicker">Reference register</span>
                    <h2>Caregiver Reference Record</h2>
                  </div>
                  <span>{caregivers.length} caregivers</span>
                </div>
                <form className="portal-form" onSubmit={handleCaregiverReference}>
                  <label>
                    Caregiver legal name
                    <input name="legalName" required placeholder="Verified full name" />
                  </label>
                  <label>
                    Phone
                    <input name="phone" placeholder="080..." />
                  </label>
                  <label>
                    Email
                    <input name="email" type="email" placeholder="caregiver@example.com" />
                  </label>
                  <label>
                    NIN last 4 digits
                    <input name="ninLast4" inputMode="numeric" maxLength={4} />
                  </label>
                  <label>
                    BVN last 4 digits
                    <input name="bvnLast4" inputMode="numeric" maxLength={4} />
                  </label>
                  <label>
                    Role held
                    <input name="roleTitle" required placeholder="Caregiver, nurse, aide" />
                  </label>
                  <label>
                    Supervisor
                    <input name="supervisorName" placeholder="Previous supervisor" />
                  </label>
                  <label>
                    Supervisor contact
                    <input name="supervisorContact" placeholder="Phone or email" />
                  </label>
                  <label className="span-2">
                    Conduct summary
                    <textarea name="conductSummary" placeholder="Verified employment and conduct notes" />
                  </label>
                  <label className="portal-check span-2">
                    <input name="consentObtained" type="checkbox" required />
                    Consent obtained for reference registration
                  </label>
                  <label className="portal-check span-2">
                    <input name="rehireEligible" type="checkbox" />
                    Previous employer would rehire
                  </label>
                  <button type="submit" disabled={loading}>
                    Add Caregiver Reference
                  </button>
                </form>
                <div className="portal-list compact-list">
                  {caregivers.map((caregiver) => {
                    const reference = caregiverReferences.find(
                      (item) => item.caregiver_id === caregiver.id,
                    );
                    return (
                      <div key={caregiver.id}>
                        <b>{caregiver.legal_name}</b>
                        <span>
                          {reference?.role_title ?? "Reference pending"} -{" "}
                          {reference?.verification_status ?? caregiver.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {isAdmin ? (
                <section className="portal-card">
                  <div className="portal-section-head">
                    <div>
                      <span className="portal-kicker">Access control</span>
                      <h2>User Roles</h2>
                    </div>
                    <span>{profiles.length} users</span>
                  </div>
                  <div className="portal-table" role="table" aria-label="User access">
                    {profiles.map((profileRow) => (
                      <form
                        className="portal-table-row"
                        key={profileRow.id}
                        onSubmit={(event) => {
                          event.preventDefault();
                          const formData = new FormData(event.currentTarget);
                          void handleProfileChange(
                            profileRow,
                            String(formData.get("role")) as Profile["role"],
                            String(formData.get("status")) as Profile["status"],
                          );
                        }}
                      >
                        <span>
                          <b>{profileRow.full_name || profileRow.email || "Unnamed user"}</b>
                          <small>{profileRow.email}</small>
                        </span>
                        <select name="role" defaultValue={profileRow.role}>
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                        <select name="status" defaultValue={profileRow.status}>
                          <option value="pending">Pending</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                        </select>
                        <button type="submit" disabled={loading}>
                          Save
                        </button>
                      </form>
                    ))}
                  </div>
                </section>
              ) : null}
            </section>
          ) : null}

          <section className="portal-card" id="membership-application">
            <div className="portal-section-head">
              <div>
                <span className="portal-kicker">Membership</span>
                <h2>Your Organisation Records</h2>
              </div>
              <span>{organizations.length} records visible</span>
            </div>
            {organizations.length ? (
              <div className="portal-list">
                {organizations.map((organization) => (
                  <div key={organization.id}>
                    <b>{organization.name}</b>
                    <span>
                      {organization.membership_number || "Membership number pending"} · {organization.status}
                      {organization.renewal_due_date
                        ? ` · renewal ${formatDate(organization.renewal_due_date)}`
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-membership-state">
                <p>No organisation is linked to this account yet.</p>
                <Link className="portal-secondary-button" href="/apply">Submit a Membership Application</Link>
              </div>
            )}
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
                Last known photo
                <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
              </label>
              <label>
                Last seen date and time
                <input name="lastSeenAt" type="datetime-local" />
              </label>
              <label>
                Police reference
                <input name="policeReference" placeholder="Optional case reference" />
              </label>
              <label className="span-2">
                Last seen location
                <input name="lastSeenLocation" required placeholder="Street, LGA, landmark" />
              </label>
              <label>
                Submitter name
                <input name="submitterName" placeholder="Person reporting" />
              </label>
              <label>
                Submitter phone
                <input name="submitterPhone" placeholder="080..." />
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
              <fieldset className="medical-conditions span-2" aria-describedby="medical-conditions-help">
                <legend>Likely medical conditions</legend>
                <p id="medical-conditions-help">
                  Select all that may apply. These details remain restricted to authorised staff.
                </p>
                <div className="medical-condition-grid">
                  {[
                    "Dementia or memory loss",
                    "Epilepsy or seizure disorder",
                    "Hypertension",
                    "Diabetes",
                    "Heart condition",
                    "Stroke history",
                    "Asthma or breathing difficulty",
                    "Mobility difficulty",
                  ].map((condition) => (
                    <label className="medical-condition-option" key={condition}>
                      <input name="medicalConditions" type="checkbox" value={condition} />
                      <span>{condition}</span>
                    </label>
                  ))}
                </div>
                <label className="medical-condition-details">
                  Other condition or important details
                  <textarea
                    name="medicalRisksOther"
                    placeholder="Add another likely condition, medication need, or relevant detail"
                  />
                </label>
              </fieldset>
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
            <h2>Sign in to the portal</h2>
            <label>
              Email
              <input name="email" type="email" required placeholder="you@example.com" />
            </label>
            <label>
              Password
              <input name="password" type="password" required minLength={6} />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? "Please wait" : "Sign In"}
            </button>
            <p className="auth-application-link">
              Need portal access? <Link href="/apply">Apply for membership</Link>
            </p>
          </form>

          <aside className="portal-card">
            <span className="portal-kicker">What opens next</span>
            <h2>Role-based access</h2>
            <p>
              Applications are reviewed by an authorised compliance officer.
              Approved member contacts receive a secure email invitation and
              set their own portal password.
            </p>
          </aside>
        </section>
      )}

      <section className="portal-grid-layout" id="public-alerts">
        <article className="portal-card">
          <div className="portal-section-head">
            <h2>Announcements</h2>
            <span>{usingSampleAnnouncements ? "Sample" : visibleAnnouncements.length}</span>
          </div>
          <div className="portal-list">
            {visibleAnnouncements.length ? (
              visibleAnnouncements.map((announcement) => (
                <div key={announcement.id}>
                  <b>{announcement.title}</b>
                  <span>{announcement.body}</span>
                </div>
              ))
            ) : (
              <p>Sample announcements will appear here when the demo data loads.</p>
            )}
          </div>
        </article>

        <article className="portal-card">
          <div className="portal-section-head">
            <h2>Missing Elder Alerts</h2>
            <span>{usingSampleMissingCases ? "Sample" : visibleMissingCases.length}</span>
          </div>
          <div className="portal-list">
            {visibleMissingCases.length ? (
              visibleMissingCases.map((caseItem) => {
                const photoUrl = getPhotoUrl(caseItem.photo_path);
                return (
                  <div className="portal-row-card with-photo" key={caseItem.id}>
                    {photoUrl ? (
                      <img
                        className="case-photo-thumb"
                        src={photoUrl}
                        alt={`Last known photo for ${caseItem.elder_name}`}
                      />
                    ) : (
                      <span className="case-photo-thumb placeholder">No Photo</span>
                    )}
                    <span>
                      <b>{caseItem.elder_name}</b>
                      <small>
                        {caseItem.last_seen_location} - {formatDate(caseItem.last_seen_at)}
                      </small>
                      {caseItem.public_notes ? <small>{caseItem.public_notes}</small> : null}
                    </span>
                  </div>
                );
              })
            ) : (
              <p>Sample public alerts will appear here when the demo data loads.</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
