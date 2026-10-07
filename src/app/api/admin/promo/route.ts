import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  code: z.string().trim().min(3).max(40).optional(),
  expiryHours: z.number().min(1).max(43800).optional(),
  usageLimit: z.number().int().min(1).max(500).optional(),
  isSingleUse: z.boolean().optional(),
  note: z.string().trim().max(200).optional(),
  bonusAmount: z.number().min(1).max(1000000).optional(),
  bonusMode: z.enum(["SET_TO_100", "ADD_100"]).optional(),
});

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }
    throw error;
  }

  const promos = await db.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ promos: promos.map((promo) => ({
    id: promo.id,
    code: promo.code,
    bonusAmount: Number(promo.bonusAmount) / 100,
    bonusMode: promo.bonusMode,
    isActive: promo.isActive,
    isSingleUse: promo.isSingleUse,
    usageLimit: promo.usageLimit,
    usageCount: promo.usageCount,
    note: promo.note,
    expiresAt: promo.expiresAt,
    createdBy: promo.createdBy.name,
  })) });
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }
    throw error;
  }

  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Provide a valid promo code request." }, { status: 400 });
  }

  const admin = await requireAdmin();
  const generated = (body.data.code || `PV-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`).toUpperCase();
  const bonusAmount = BigInt(Math.round((body.data.bonusAmount ?? 100) * 100));

  try {
    const promo = await db.promoCode.create({
      data: {
        code: generated,
        createdById: admin.id,
        expiresAt: body.data.expiryHours ? new Date(Date.now() + body.data.expiryHours * 60 * 60 * 1000) : null,
        usageLimit: body.data.usageLimit ?? null,
        isSingleUse: body.data.isSingleUse ?? true,
        note: body.data.note ?? null,
        bonusAmount,
        bonusMode: body.data.bonusMode ?? "SET_TO_100",
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, promo: { id: promo.id, code: promo.code, bonusAmount: Number(promo.bonusAmount) / 100, bonusMode: promo.bonusMode, note: promo.note } });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "This promo code already exists. Choose another one." }, { status: 409 });
    }
    throw error;
  }
}
