import { createClient } from "npm:@supabase/supabase-js@2.111.0";

type ReviewRequest = {
  applicationId?: string;
  decision?: "approve" | "reject";
  notes?: string;
};

const allowedHeaders =
  "authorization, x-client-info, apikey, content-type";

function response(origin: string, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": allowedHeaders,
      Vary: "Origin",
    },
  });
}

function getAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const productionOrigin = Deno.env.get("APP_URL") ?? "https://apec-lagos.vercel.app";
  const allowedOrigins = new Set([
    productionOrigin,
    "https://apec-lagos.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);

  return allowedOrigins.has(origin) ? origin : productionOrigin;
}

Deno.serve(async (request) => {
  const origin = getAllowedOrigin(request);

  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": allowedHeaders,
        Vary: "Origin",
      },
    });
  }

  if (request.method !== "POST") {
    return response(origin, { error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !serviceRoleKey || !authorization) {
    return response(origin, { error: "The approval service is not configured." }, 500);
  }

  const token = authorization.replace(/^Bearer\s+/i, "");
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData.user) {
    return response(origin, { error: "A valid staff session is required." }, 401);
  }

  const { data: reviewer, error: reviewerError } = await adminClient
    .from("profiles")
    .select("id,role,status")
    .eq("id", userData.user.id)
    .single();

  if (
    reviewerError ||
    !reviewer ||
    reviewer.status !== "active" ||
    !["super_admin", "secretary_admin", "compliance_officer"].includes(reviewer.role)
  ) {
    return response(origin, { error: "Compliance approval access is required." }, 403);
  }

  let payload: ReviewRequest;
  try {
    payload = await request.json();
  } catch {
    return response(origin, { error: "Invalid request body." }, 400);
  }

  const applicationId = payload.applicationId?.trim();
  const decision = payload.decision;
  const notes = payload.notes?.trim() || null;

  if (!applicationId || !decision || !["approve", "reject"].includes(decision)) {
    return response(origin, { error: "Application and decision are required." }, 400);
  }

  const { data: application, error: applicationError } = await adminClient
    .from("membership_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (applicationError || !application) {
    return response(origin, { error: "Membership application was not found." }, 404);
  }

  if (!["pending", "under_review"].includes(application.status)) {
    return response(origin, { error: "This application has already been reviewed." }, 409);
  }

  if (decision === "reject") {
    const { error } = await adminClient
      .from("membership_applications")
      .update({
        status: "rejected",
        review_notes: notes,
        reviewed_by: reviewer.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", application.id)
      .in("status", ["pending", "under_review"]);

    if (error) return response(origin, { error: error.message }, 400);
    return response(origin, { message: "Application rejected." });
  }

  const redirectTo = `${Deno.env.get("APP_URL") ?? "https://apec-lagos.vercel.app"}/portal?invited=1`;
  const { data: existingProfile, error: profileLookupError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", application.email)
    .maybeSingle();

  if (profileLookupError) {
    return response(origin, { error: profileLookupError.message }, 400);
  }

  let authUser = null;
  let invitationSent = false;

  if (existingProfile) {
    const { data: existingUserData, error: existingUserError } =
      await adminClient.auth.admin.getUserById(existingProfile.id);
    if (existingUserError) {
      return response(origin, { error: existingUserError.message }, 400);
    }
    authUser = existingUserData.user;
  }

  if (!authUser) {
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(application.email, {
        data: {
          full_name: application.contact_full_name,
          membership_application_id: application.id,
        },
        redirectTo,
      });

    if (inviteError || !inviteData.user) {
      return response(origin, { error: inviteError?.message ?? "Could not create the invitation." }, 400);
    }

    authUser = inviteData.user;
    invitationSent = true;
  }

  const joinedAt = new Date();
  const renewalDueAt = new Date(joinedAt);
  renewalDueAt.setFullYear(joinedAt.getFullYear() + 1);
  const membershipNumber = `APEC-${joinedAt.getFullYear()}-${application.id
    .slice(0, 6)
    .toUpperCase()}`;

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: authUser.id,
    email: application.email,
    full_name: application.contact_full_name,
    phone: application.phone,
    role: "member",
    status: "active",
  });

  if (profileError) return response(origin, { error: profileError.message }, 400);

  let organizationId = application.organization_id as string | null;
  if (!organizationId) {
    const { data: organization, error: organizationError } = await adminClient
      .from("member_organizations")
      .insert({
        name: application.organization_name,
        category_id: application.membership_category_id,
        membership_number: membershipNumber,
        contact_person: application.contact_full_name,
        position_title: application.position_title,
        services_offered: application.services_offered
          ? [application.services_offered]
          : [],
        phone: application.phone,
        email: application.email,
        lga: application.lga,
        address: application.address,
        state_registered: application.registration_number,
        year_established: application.year_established,
        status: "active",
        date_joined: joinedAt.toISOString().slice(0, 10),
        renewal_due_date: renewalDueAt.toISOString().slice(0, 10),
        created_by: authUser.id,
      })
      .select("id")
      .single();

    if (organizationError || !organization) {
      return response(origin, { error: organizationError?.message ?? "Could not create the member record." }, 400);
    }
    organizationId = organization.id;
  }

  const { error: memberLinkError } = await adminClient
    .from("organization_members")
    .upsert(
      {
        organization_id: organizationId,
        user_id: authUser.id,
        organization_role: "owner",
        is_primary: true,
      },
      { onConflict: "organization_id,user_id" },
    );

  if (memberLinkError) return response(origin, { error: memberLinkError.message }, 400);

  const { error: updateError } = await adminClient
    .from("membership_applications")
    .update({
      status: "approved",
      review_notes: notes,
      reviewed_by: reviewer.id,
      reviewed_at: joinedAt.toISOString(),
      auth_user_id: authUser.id,
      organization_id: organizationId,
      invited_at: joinedAt.toISOString(),
    })
    .eq("id", application.id)
    .in("status", ["pending", "under_review"]);

  if (updateError) return response(origin, { error: updateError.message }, 400);

  if (!invitationSent) {
    const { error: resetError } = await adminClient.auth.resetPasswordForEmail(
      application.email,
      { redirectTo },
    );
    if (resetError) {
      return response(origin, {
        message: "Application approved, but the access email could not be resent.",
        warning: resetError.message,
      });
    }
  }

  return response(origin, {
    message: invitationSent
      ? "Application approved and the portal invitation was emailed."
      : "Application approved and a password setup email was sent.",
  });
});
