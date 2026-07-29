import { createClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  role: "super_admin" | "secretary_admin" | "committee_member" | "member" | "pending_member";
  status: "pending" | "active" | "suspended";
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
  status: "pending_review" | "active" | "found" | "closed" | "rejected";
  published_at: string | null;
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
