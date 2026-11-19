import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth";

export async function POST(request: Request) {
  await destroyAdminSession();
  const url = new URL("/admin/login", request.url);
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET(request: Request) {
  await destroyAdminSession();
  const url = new URL("/admin/login", request.url);
  return NextResponse.redirect(url, { status: 303 });
}

