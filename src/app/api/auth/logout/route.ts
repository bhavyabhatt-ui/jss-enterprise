import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";
import { bumpAuthSessionVersion } from "@/lib/server-storage";

export async function POST(req: NextRequest) {
  const isAll = req.nextUrl.searchParams.get("all") === "true";

  if (isAll) {
    try {
      await bumpAuthSessionVersion();
    } catch (err) {
      console.warn("Failed to bump auth session version on remote logout:", err);
    }
  }

  const response = NextResponse.json({
    success: true,
    message: isAll ? "Logged out from all devices" : "Logged out successfully",
  });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function GET(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  const response = NextResponse.redirect(loginUrl);

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
