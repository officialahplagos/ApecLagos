"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
  type MembershipCategory,
} from "../../lib/supabase/client";

type Notice = {
  tone: "success" | "error";
  text: string;
};

function buildApplicationReference() {
  return `APEC-MA-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

export function MembershipApplicationForm() {
  const configured = hasSupabaseConfig();
  const supabase = useMemo(
    () => (configured ? createBrowserSupabaseClient() : null),
    [configured],
  );
  const [categories, setCategories] = useState<MembershipCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(configured);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase
      .from("membership_categories")
      .select("id,name,description,annual_dues,is_active")
      .eq("is_active", true)
      .order("name")
      .then(({ data, error }) => {
        if (!active) return;

        if (error || !data?.length) {
          setCategoryError(
            error
              ? "Membership categories could not be loaded. Please try again shortly."
              : "Membership applications are temporarily unavailable while categories are updated.",
          );
        } else {
          setCategories(data as MembershipCategory[]);
        }
        setLoadingCategories(false);
      });

    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const website = String(formData.get("website") ?? "").trim();
    const reference = buildApplicationReference();
    const yearValue = String(formData.get("yearEstablished") ?? "").trim();

    if (website) {
      setSubmittedReference(reference);
      return;
    }

    setLoading(true);
    setNotice(null);

    const { error } = await supabase.from("membership_applications").insert({
      application_reference: reference,
      organization_name: String(formData.get("organizationName") ?? "").trim(),
      membership_category_id: String(formData.get("categoryId") ?? "") || null,
      contact_full_name: String(formData.get("contactFullName") ?? "").trim(),
      position_title: String(formData.get("positionTitle") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim().toLowerCase(),
      phone: String(formData.get("phone") ?? "").trim(),
      lga: String(formData.get("lga") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      registration_number:
        String(formData.get("registrationNumber") ?? "").trim() || null,
      year_established: yearValue ? Number(yearValue) : null,
      services_offered: String(formData.get("servicesOffered") ?? "").trim() || null,
      consent_confirmed: formData.get("consentConfirmed") === "on",
    });

    setLoading(false);

    if (error) {
      const duplicate = error.code === "23505";
      setNotice({
        tone: "error",
        text: duplicate
          ? "An application for this email address is already awaiting review."
          : "We could not submit the application. Check the details and try again.",
      });
      return;
    }

    form.reset();
    setSubmittedReference(reference);
  }

  if (submittedReference) {
    return (
      <section className="application-success" aria-live="polite">
        <span className="application-success-icon" aria-hidden="true">✓</span>
        <span className="portal-kicker">Application received</span>
        <h1>Thank you. Your details are with the compliance team.</h1>
        <p>
          Keep this reference for follow-up: <strong>{submittedReference}</strong>
        </p>
        <p>
          If approved, an invitation will be sent to the email address supplied.
          You will use that secure link to set your portal password.
        </p>
        <div className="application-success-actions">
          <button type="button" onClick={() => setSubmittedReference(null)}>
            Submit another application
          </button>
          <Link href="/portal">Go to portal sign in</Link>
        </div>
      </section>
    );
  }

  return (
    <form className="application-form" onSubmit={handleSubmit} aria-busy={loading}>
      <div className="application-form-head">
        <span className="portal-kicker">Member onboarding</span>
        <h1>Apply for APEC Lagos membership</h1>
        <p>
          Submit your organisation and primary contact details for compliance
          review. Portal access is issued only after approval.
        </p>
      </div>

      {notice ? <div className={`portal-notice ${notice.tone}`}>{notice.text}</div> : null}

      <fieldset>
        <legend>Organisation details</legend>
        <div className="application-fields">
          <label className="span-2">
            Registered organisation name
            <input name="organizationName" required minLength={2} maxLength={180} />
          </label>
          <label>
            Membership category
            <select name="categoryId" required defaultValue="" disabled={loadingCategories || Boolean(categoryError)}>
              <option value="" disabled>
                {loadingCategories ? "Loading categories..." : "Select category"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            CAC or registration number
            <input name="registrationNumber" maxLength={80} placeholder="Optional" />
          </label>
          <label>
            Year established
            <input
              name="yearEstablished"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              inputMode="numeric"
            />
          </label>
          <label>
            Lagos LGA
            <input name="lga" maxLength={100} placeholder="e.g. Ikeja" />
          </label>
          <label className="span-2">
            Facility or office address
            <textarea name="address" maxLength={500} required />
          </label>
          <label className="span-2">
            Elderly care services offered
            <textarea
              name="servicesOffered"
              maxLength={1000}
              required
              placeholder="Briefly describe your services"
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Primary contact</legend>
        <div className="application-fields">
          <label>
            Full name
            <input name="contactFullName" required minLength={2} maxLength={140} />
          </label>
          <label>
            Position in the organisation
            <input name="positionTitle" required maxLength={120} />
          </label>
          <label>
            Work email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Phone number
            <input name="phone" type="tel" required autoComplete="tel" maxLength={30} />
          </label>
        </div>
      </fieldset>

      <label className="application-consent">
        <input name="consentConfirmed" type="checkbox" required />
        <span>
          I confirm that I am authorised to submit these details and consent to
          APEC Lagos using them for membership verification, contact, and portal
          administration.
        </span>
      </label>

      <label className="hp-field" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <button
        className="application-submit"
        type="submit"
        disabled={loading || !configured || loadingCategories || Boolean(categoryError)}
      >
        {loading ? "Submitting application..." : "Submit for compliance review"}
      </button>
      {!configured ? <p className="form-config-error">Application service is unavailable.</p> : null}
      {categoryError ? <p className="form-config-error">{categoryError}</p> : null}
      <p className="application-login-link">
        Already approved? <Link href="/portal">Sign in to the member portal</Link>
      </p>
    </form>
  );
}
