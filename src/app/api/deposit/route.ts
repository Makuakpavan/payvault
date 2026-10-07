import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { CODES, FALLBACK_RATES } from "@/lib/money";

const schema = z.object({
  currency: z.enum(CODES),
  amount: z.number().positive().max(1_000_000),
  cardLast4: z.string().regex(/^\d{4}$/),
  reference: z.string().min(8),
  promoCode: z.string().trim().min(3),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) {
    return NextResponse.json({ error: "Check the amount, currency, card details, and promo code." }, { status: 400 });
  }

  const normalizedPromo = p.data.promoCode.toUpperCase();
  const promo = await db.promoCode.findUnique({ where: { code: normalizedPromo } });
  if (!promo || !promo.isActive || (promo.expiresAt && promo.expiresAt < new Date()) || (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit)) {
    return NextResponse.json({ error: "The promo code is invalid, expired, or no longer active." }, { status: 400 });
  }

  const lastAppliedMatch = user.lastAppliedPromo && user.lastAppliedPromo.toUpperCase() === normalizedPromo;
  if (!lastAppliedMatch) {
    return NextResponse.json({ error: "Apply a valid promo code before confirming the deposit." }, { status: 400 });
  }

  const rate = FALLBACK_RATES[p.data.currency] ?? 1;
  const amountUsd = p.data.currency === "USD" ? p.data.amount : p.data.amount / rate;
  const amountCents = BigInt(Math.round(amountUsd * 100));

  if (amountCents <= 0n) {
    return NextResponse.json({ error: "Amount is too small." }, { status: 400 });
  }

  try {
    await db.$transaction([
      db.transaction.create({
        data: {
          userId: user.id,
          type: "DEPOSIT",
          status: "COMPLETED",
          currency: p.data.currency,
          amount: amountCents,
          amountUsd: amountCents,
          reference: p.data.reference,
          cardLast4: p.data.cardLast4,
          notes: p.data.notes ?? undefined,
          promoCodeId: promo.id,
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { balance: { increment: amountCents } },
      }),
      db.wallet.upsert({
        where: { userId_currency: { userId: user.id, currency: "USD" } },
        create: { userId: user.id, currency: "USD", balance: amountCents },
        update: { balance: { increment: amountCents } },
      }),
    ]);
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "This payment was already processed." }, { status: 409 });
    throw e;
  }

  return NextResponse.json({ ok: true });
}
