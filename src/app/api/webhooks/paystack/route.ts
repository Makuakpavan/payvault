import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

// Paystack calls this after a successful charge. Verified by HMAC; idempotent via the PENDING check.
export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const sig = req.headers.get("x-paystack-signature");
  if (!secret || !sig || crypto.createHmac("sha512", secret).update(raw).digest("hex") !== sig)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const evt = JSON.parse(raw);
  if (evt.event === "charge.success") {
    await db.$transaction(async (tx) => {
      const t = await tx.transaction.findUnique({ where: { reference: evt.data.reference } });
      if (!t || t.type !== "DEPOSIT" || t.status !== "PENDING") return;
      await tx.transaction.update({ where: { id: t.id }, data: { status: "COMPLETED" } });
      await tx.wallet.upsert({ where: { userId_currency: { userId: t.userId, currency: t.currency } }, create: { userId: t.userId, currency: t.currency, balance: t.amount }, update: { balance: { increment: t.amount } } });
    });
  }
  return NextResponse.json({ ok: true });
}
