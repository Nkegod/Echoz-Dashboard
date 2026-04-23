import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type CreateUserRequestBody = {
  email?: string;
  password?: string;
  fullName?: string;
  role?: "admin" | "staff";
  requestedByUserId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateUserRequestBody;
    const { email, password, fullName, role, requestedByUserId } = body;

    if (!email || !password || !fullName || !role || !requestedByUserId) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!["admin", "staff"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role selected." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFullName = fullName.trim();

    if (!normalizedEmail || !normalizedFullName) {
      return NextResponse.json(
        { error: "Email and full name are required." },
        { status: 400 }
      );
    }

    const { data: requesterProfile, error: requesterError } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", requestedByUserId)
      .single();

    if (requesterError || !requesterProfile) {
      return NextResponse.json(
        { error: "Unable to verify requesting user." },
        { status: 403 }
      );
    }

    if (requesterProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create users." },
        { status: 403 }
      );
    }

    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: normalizedFullName,
        },
      });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        {
          error:
            createUserError?.message || "Failed to create authentication user.",
        },
        { status: 400 }
      );
    }

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: createdUser.user.id,
      email: normalizedEmail,
      full_name: normalizedFullName,
      role,
    });

    if (profileError) {
      return NextResponse.json(
        {
          error:
            "Authentication user created, but profile creation failed: " +
            profileError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "User created successfully.",
        user: {
          id: createdUser.user.id,
          email: createdUser.user.email,
          full_name: normalizedFullName,
          role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}