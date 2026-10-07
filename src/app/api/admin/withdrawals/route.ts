import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

async function admin() { const u = await getUser(); return u && u.role === "ADMIN" ? u : null; }

export async function GET() {
  if (!(await admin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const rows = await db.transaction.findMany({
    where: { type: "WITHDRAWAL" }, orderBy: [{ createdAt: "desc" }], take: 100,
    include: { user: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ items: rows.map((t) => ({ id: t.id, status: t.status, currency: t.currency, amount: Number(t.amount), createdAt: t.createdAt, name: t.user.name, email: t.user.email })) });
}

// approve -> COMPLETED. reject -> FAILED and the money goes back to the user's wallet.
const schema = z.object({ id: z.string(), action: z.enum(["approve", "reject"]) });
export async function POST(req: Request) {
  if (!(await admin())) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  try {
    await db.$transaction(async (tx) => {
      const t = await tx.transaction.findUnique({ where: { id: p.data.id } });
      if (!t || t.type !== "WITHDRAWAL") throw new Error("NOTFOUND");
      // Only a PENDING withdrawal can change, so a double click can't refund twice.
      const r = await tx.transaction.updateMany({ where: { id: t.id, status: "PENDING" }, data: { status: p.data.action === "approve" ? "COMPLETED" : "FAILED" } });
      if (r.count === 0) throw new Error("DONE");
      if (p.data.action === "reject")
        await tx.wallet.update({ where: { userId_currency: { userId: t.userId, currency: t.currency } }, data: { balance: { increment: t.amount } } });
    });
  } catch (e: any) {
    if (e?.message === "NOTFOUND") return NextResponse.json({ error: "Withdrawal not found." }, { status: 404 });
    if (e?.message === "DONE") return NextResponse.json({ error: "This withdrawal was already reviewed." }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}
