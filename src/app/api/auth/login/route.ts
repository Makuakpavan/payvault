import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const user = await db.user.findUnique({ where: { email: String(b.email ?? "").trim().toLowerCase() } });
  if (!user || user.status === "SUSPENDED") {
    return NextResponse.json({ error: "This account is suspended or unavailable." }, { status: 403 });
  }
  if (!(await bcrypt.compare(String(b.password ?? ""), user.passwordHash)))
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  await setSession(user.id);
  return NextResponse.json({ ok: true });
}
