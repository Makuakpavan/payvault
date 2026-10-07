import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({ promoCode: z.string().trim().min(3) });

export async function POST(req: Request) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) {
    return NextResponse.json({ error: "Provide a valid promo code." }, { status: 400 });
  }

  const normalized = p.data.promoCode.toUpperCase();
  const promo = await db.promoCode.findUnique({ where: { code: normalized } });

  if (!promo || !promo.isActive) {
    return NextResponse.json({ error: "This promo code is invalid or has been revoked." }, { status: 400 });
  }

  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return NextResponse.json({ error: "This promo code has expired." }, { status: 400 });
  }

  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
    return NextResponse.json({ error: "This promo code has reached its usage limit." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, promo: { id: promo.id, code: promo.code, bonusMode: promo.bonusMode, note: promo.note } });
}
