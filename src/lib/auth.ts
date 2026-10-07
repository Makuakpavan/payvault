import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET || "payvault-dev-secret");

export async function setSession(userId: string) {
  const token = await new SignJWT({})
    .setSubject(userId)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(key());

  cookies().set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 604800,
  });
}

export async function getUser() {
  const token = cookies().get("session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key());
    const user = await db.user.findUnique({ where: { id: payload.sub! } });
    if (!user || user.status === "SUSPENDED") return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getUser();
  if (!user) throw new Error("UNAUTH");
  return user;
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "ADMIN") throw new Error("ADMIN_REQUIRED");
  return user;
}

export function isAdminRole(role: string | null | undefined) {
  return role === "ADMIN";
}
