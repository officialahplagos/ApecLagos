import { createClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role:
    | "super_admin"
    | "secretary_admin"
    | "compliance_officer"
    | "committee_member"
    | "member"
    | "pending_member";
  status: "pending" | "active" | "suspended";
};

export type MembershipApplication = {
  id: string;
  application_reference: string;
  organization_name: string;
  membership_category_id: string | null;
  contact_full_name: string;
  position_title: string | null;
  email: string;
  phone: string;
  lga: string | null;
  address: string | null;
  registration_number: string | null;
  year_established: number | null;
  services_offered: string | null;
  status: "pending" | "under_review" | "approved" | "rejected" | "withdrawn";
  review_notes: string | null;
  created_at: string;
};

export type MembershipCategory = {
  id: string;
  name: string;
  description: string | null;
  annual_dues: string;
  is_active: boolean;
};

export type MemberOrganization = {
  id: string;
  name: string;
  membership_number: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  lga: string | null;
  status: "pending" | "active" | "suspended" | "rejected" | "archived";
  renewal_due_date: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  target_audience: "public" | "members" | "admins" | "committee";
  is_pinned: boolean;
  is_urgent: boolean;
  publish_at: string;
};

export type ResourceDocument = {
  id: string;
  title: string;
  summary: string | null;
  document_type: string;
  storage_bucket: string;
  storage_path: string;
  access_level: "public" | "members" | "admin" | "restricted";
  created_at: string;
};

export type MissingElderCase = {
  id: string;
  public_reference: string;
  elder_name: string;
  approximate_age: number | null;
  photo_path: string | null;
  last_seen_location: string;
  last_seen_at: string | null;
  public_notes: string | null;
  police_reference: string | null;
  public_contact_phone: string | null;
  status: "pending_review" | "active" | "found" | "closed" | "rejected";
  published_at: string | null;
};

export type CaregiverProfile = {
  id: string;
  legal_name: string;
  phone: string | null;
  email: string | null;
  nin_last4: string | null;
  bvn_last4: string | null;
  consent_obtained: boolean;
  status: "active" | "inactive" | "under_review" | "restricted";
  created_at: string;
};

export type CaregiverEmploymentReference = {
  id: string;
  caregiver_id: string;
  role_title: string;
  supervisor_name: string | null;
  supervisor_contact: string | null;
  conduct_summary: string | null;
  rehire_eligible: boolean | null;
  consent_verified: boolean;
  verification_status: "pending" | "verified" | "disputed" | "rejected";
};

export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://twjpsdtovbfetzbbmlaz.supabase.co";

export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function createBrowserSupabaseClient() {
  if (!hasSupabaseConfig()) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}
