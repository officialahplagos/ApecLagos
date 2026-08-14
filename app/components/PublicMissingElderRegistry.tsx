"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
  type MissingElderCase,
} from "../../lib/supabase/client";

const medicalConditions = [
  "Dementia or memory loss",
  "Epilepsy or seizure disorder",
  "Hypertension",
  "Diabetes",
  "Heart condition",
  "Stroke history",
  "Asthma or breathing difficulty",
  "Mobility difficulty",
];

const allowedPhotoTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type Notice = {
  tone: "success" | "error";
  text: string;
};

function optionalText(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value || null;
}

function medicalRiskSummary(formData: FormData) {
  const conditions = formData
    .getAll("medicalConditions")
    .map((value) => String(value).trim())
    .filter(Boolean);
  const other = optionalText(formData, "medicalRisksOther");
  if (other) conditions.push(`Other details: ${other}`);
  return conditions.length ? conditions.join("; ") : null;
}

function formatLastSeen(value: string | null) {
  if (!value) return "Time not provided";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: MissingElderCase["status"]) {
  if (status === "active") return "Active alert";
  if (status === "found") return "Found";
  return "Closed";
}

export function PublicMissingElderRegistry() {
  const configured = hasSupabaseConfig();
  const supabase = useMemo(
    () => (configured ? createBrowserSupabaseClient() : null),
    [configured],
  );
  const [cases, setCases] = useState<MissingElderCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(configured);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase
      .from("missing_elder_cases")
      .select(
        "id,public_reference,elder_name,approximate_age,photo_path,last_seen_location,last_seen_at,public_notes,police_reference,public_contact_phone,status,published_at",
      )
      .in("status", ["active", "found", "closed"])
      .order("published_at", { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setCases((data ?? []) as MissingElderCase[]);
        setLoadingCases(false);
      });

    return () => {
      active = false;
    };
  }, [supabase]);

  function photoUrl(path: string) {
    if (!supabase) return "";
    return supabase.storage.from("missing-elder-photos").getPublicUrl(path).data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    if (String(formData.get("website") ?? "").trim()) return;

    const photo = formData.get("photo");
    const ageText = String(formData.get("age") ?? "").trim();
    let photoPath: string | null = null;

    setSubmitting(true);
    setNotice(null);

    try {
      if (photo instanceof File && photo.size > 0) {
        const extension = allowedPhotoTypes.get(photo.type);
        if (!extension) throw new Error("Upload a JPG, PNG, or WebP photo.");
        if (photo.size > 5 * 1024 * 1024) throw new Error("The photo must be 5 MB or smaller.");

        photoPath = `public-intake/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("missing-elder-photos")
          .upload(photoPath, photo, { contentType: photo.type, upsert: false });
        if (uploadError) throw uploadError;
      }

      const { data: reference, error } = await supabase.rpc(
        "submit_missing_elder_report",
        {
          p_elder_name: String(formData.get("elderName") ?? "").trim(),
          p_approximate_age: ageText ? Number(ageText) : null,
          p_photo_path: photoPath,
          p_last_seen_location: String(formData.get("lastSeenLocation") ?? "").trim(),
          p_last_seen_at: optionalText(formData, "lastSeenAt"),
          p_public_notes: optionalText(formData, "publicNotes"),
          p_police_reference: optionalText(formData, "policeReference"),
          p_public_contact_phone: String(formData.get("contactPhone") ?? "").trim(),
          p_submitter_name: String(formData.get("submitterName") ?? "").trim(),
          p_submitter_phone: String(formData.get("submitterPhone") ?? "").trim(),
          p_family_contact_name: optionalText(formData, "contactName"),
          p_medical_risks: medicalRiskSummary(formData),
          p_private_notes: optionalText(formData, "privateNotes"),
          p_consent_confirmed: formData.get("consentConfirmed") === "on",
        },
      );

      if (error) throw error;
      form.reset();
      setNotice({
        tone: "success",
        text: `Report received for officer review. Keep reference ${String(reference)} for follow-up.`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "The report could not be submitted.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="registry-layout public-registry-layout">
      <div className="elder-board" aria-live="polite">
        {loadingCases ? <div className="public-empty-state">Loading verified alerts...</div> : null}
        {!loadingCases && !cases.length ? (
          <div className="public-empty-state">
            <h3>No verified public alerts are active.</h3>
            <p>New reports appear here only after an authorised officer confirms them for publication.</p>
          </div>
        ) : null}
        {cases.map((caseItem) => (
          <article className="elder-card" key={caseItem.id}>
            <div className="missing-photo">
              {caseItem.photo_path ? (
                // Supabase storage URLs are approved only after the case is published.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl(caseItem.photo_path)} alt={`Last known photo of ${caseItem.elder_name}`} />
              ) : (
                <span>No public photo</span>
              )}
            </div>
            <div>
              <div className="card-topline">
                <h3>{caseItem.elder_name}</h3>
                <span>{statusLabel(caseItem.status)}</span>
              </div>
              <dl>
                <div><dt>Age</dt><dd>{caseItem.approximate_age ?? "Not provided"}</dd></div>
                <div><dt>Last seen</dt><dd>{caseItem.last_seen_location}</dd></div>
                <div><dt>Date and time</dt><dd>{formatLastSeen(caseItem.last_seen_at)}</dd></div>
                <div><dt>Reference</dt><dd>{caseItem.public_reference}</dd></div>
              </dl>
              {caseItem.public_notes ? <p className="elder-public-notes">{caseItem.public_notes}</p> : null}
              {caseItem.public_contact_phone ? (
                <a className="elder-contact-link" href={`tel:${caseItem.public_contact_phone}`}>
                  If found, call {caseItem.public_contact_phone}
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <form className="intake-form public-missing-form" onSubmit={handleSubmit}>
        <div>
          <span className="portal-kicker">Officer-reviewed intake</span>
          <h3>Report a missing elderly person</h3>
          <p>Reports are checked before any information is published.</p>
        </div>

        {notice ? <div className={`portal-notice ${notice.tone}`} role="status">{notice.text}</div> : null}

        <div className="public-intake-fields">
          <label>Elder&apos;s full name<input name="elderName" required minLength={2} maxLength={180} /></label>
          <label>Approximate age<input name="age" type="number" min="50" max="120" inputMode="numeric" /></label>
          <label className="span-2">Last known photo<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
          <label>Last seen date and time<input name="lastSeenAt" type="datetime-local" /></label>
          <label>Police reference<input name="policeReference" maxLength={100} placeholder="Optional" /></label>
          <label className="span-2">Last seen location<input name="lastSeenLocation" required maxLength={500} placeholder="Street, LGA, landmark" /></label>
          <label className="span-2">Public description<textarea name="publicNotes" maxLength={1500} placeholder="Clothing, appearance, and safe approach guidance" /></label>

          <fieldset className="public-medical-conditions span-2" aria-describedby="public-medical-help">
            <legend>Likely medical conditions</legend>
            <p id="public-medical-help">Select all that may apply. Medical information is visible only to authorised safeguarding staff.</p>
            <div className="medical-condition-grid">
              {medicalConditions.map((condition) => (
                <label className="medical-condition-option" key={condition}>
                  <input name="medicalConditions" type="checkbox" value={condition} />
                  <span>{condition}</span>
                </label>
              ))}
            </div>
            <label className="medical-condition-details">
              Other condition or medication need
              <textarea name="medicalRisksOther" maxLength={1500} />
            </label>
          </fieldset>

          <label>Reporter&apos;s full name<input name="submitterName" required minLength={2} maxLength={140} /></label>
          <label>Reporter&apos;s phone<input name="submitterPhone" type="tel" required minLength={7} maxLength={30} /></label>
          <label>Family or contact name<input name="contactName" maxLength={140} /></label>
          <label>Public callback number<input name="contactPhone" type="tel" required minLength={7} maxLength={30} /></label>
          <label className="span-2">Private note for the safeguarding team<textarea name="privateNotes" maxLength={1000} placeholder="Relationship to the missing person or other confidential context" /></label>
        </div>

        <label className="public-intake-consent">
          <input name="consentConfirmed" type="checkbox" required />
          <span>I confirm that I am authorised to submit these details for safeguarding review and understand that only approved alert information will be published.</span>
        </label>
        <label className="hp-field" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <button type="submit" disabled={submitting || !configured}>
          {submitting ? "Submitting securely..." : "Submit for Officer Review"}
        </button>
        {!configured ? <p className="form-config-error">The reporting service is temporarily unavailable.</p> : null}
      </form>
    </div>
  );
}
