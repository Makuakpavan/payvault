import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  reason: z.string().trim().max(200).optional(),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }
    throw error;
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    include: {
      promoCode: { select: { code: true, note: true, bonusMode: true } },
      redemptions: { include: { promoCode: { select: { code: true } } }, orderBy: { createdAt: "desc" } },
      transactions: { orderBy: { createdAt: "desc" }, take: 50 },
      adminAdjustments: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      balance: Number(user.balance),
      createdAt: user.createdAt,
      lastAppliedPromo: user.lastAppliedPromo,
      promoCode: user.promoCode ? { code: user.promoCode.code, note: user.promoCode.note, bonusMode: user.promoCode.bonusMode } : null,
      redemptions: user.redemptions.map((r) => ({ id: r.id, code: r.promoCode.code, bonusAmount: Number(r.bonusAmount), createdAt: r.createdAt })),
      transactions: user.transactions.map((t) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        currency: t.currency,
        amount: Number(t.amount),
        createdAt: t.createdAt,
      })),
      adminAdjustments: user.adminAdjustments.map((a) => ({
        id: a.id,
        amount: Number(a.amount),
        direction: a.direction,
        reason: a.reason,
        originalCurrency: a.originalCurrency,
        createdAt: a.createdAt,
      })),
    },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }
    throw error;
  }

  const body = statusSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Provide a valid status update." }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Admin accounts cannot be removed from the dashboard." }, { status: 400 });
  }

  const nextStatus = body.data.status ?? "SUSPENDED";
  const user = await db.user.update({
    where: { id: target.id },
    data: {
      status: nextStatus,
    },
  });

  return NextResponse.json({ ok: true, user: { id: user.id, status: user.status } });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }
    throw error;
  }

  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Admin accounts cannot be removed from the dashboard." }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: target.id },
    data: { status: "SUSPENDED" },
  });

  return NextResponse.json({ ok: true, user: { id: user.id, status: user.status } });
}
