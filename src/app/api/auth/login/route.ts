import { NextRequest, NextResponse } from "next/server";
import { getAdminCredentials, createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const creds = getAdminCredentials();

    if (
      username.trim() !== creds.username ||
      password.trim() !== creds.password
    ) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = await createSessionToken(creds.username);

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: creds.username,
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error during login", details: err?.message },
      { status: 500 }
    );
  }
}

