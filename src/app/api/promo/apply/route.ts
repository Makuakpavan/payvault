import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";

const schema = z.object({ promoCode: z.string().trim().min(3) });

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const payload = schema.safeParse(await req.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Provide a valid promo code." }, { status: 400 });
  }

  const normalized = payload.data.promoCode.toUpperCase();
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

  const existingRedemption = await db.promoRedemption.findUnique({
    where: { userId_promoCodeId: { userId: user.id, promoCodeId: promo.id } },
  });

  if (existingRedemption) {
    return NextResponse.json({ error: "You have already applied this promo code." }, { status: 409 });
  }

  const bonusAmount = promo.bonusAmount;
  const nextBalance = promo.bonusMode === "ADD_100" ? user.balance + bonusAmount : bonusAmount;

  await db.$transaction([
    db.promoRedemption.create({
      data: {
        userId: user.id,
        promoCodeId: promo.id,
        bonusAmount,
      },
    }),
    db.user.update({
      where: { id: user.id },
      data: {
        balance: nextBalance,
        lastAppliedPromo: promo.code,
      },
    }),
    db.promoCode.update({
      where: { id: promo.id },
      data: { usageCount: { increment: 1 } },
    }),
    db.transaction.create({
      data: {
        userId: user.id,
        type: "BONUS",
        status: "COMPLETED",
        currency: "USD",
        amount: bonusAmount,
        amountUsd: bonusAmount,
        reference: `promo-${promo.id}-${user.id}`,
        notes: `Promo code ${promo.code} redeemed`,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    bonus: Number(bonusAmount) / 100,
    balance: Number(nextBalance),
    message: `Promo code applied. ${Number(bonusAmount) / 100} USD added to your balance.`,
  });
}
