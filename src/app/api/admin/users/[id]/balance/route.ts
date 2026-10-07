import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const schema = z.object({
  amount: z.number().finite().refine((v) => v > 0, "Amount must be greater than zero."),
  direction: z.enum(["INCREMENT", "DECREMENT"]),
  reason: z.string().trim().max(200).optional(),
  currency: z.string().default("USD"),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
    return NextResponse.json({ error: "Provide a valid amount and direction." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: params.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const delta = BigInt(Math.round(body.data.amount * 100));
  const nextBalance = body.data.direction === "INCREMENT" ? user.balance + delta : user.balance - delta;

  if (nextBalance < 0n) {
    return NextResponse.json({ error: "The new balance cannot go below zero." }, { status: 400 });
  }

  const admin = await requireAdmin();
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { balance: nextBalance } }),
    db.adminAdjustment.create({
      data: {
        adminId: admin.id,
        userId: user.id,
        amount: delta,
        originalCurrency: body.data.currency,
        direction: body.data.direction,
        reason: body.data.reason ?? "Manual admin adjustment",
      },
    }),
    db.transaction.create({
      data: {
        userId: user.id,
        type: "ADJUSTMENT",
        status: "COMPLETED",
        currency: body.data.currency,
        amount: delta,
        amountUsd: delta,
        reference: `adjust-${user.id}-${Date.now()}`,
        notes: body.data.reason ?? "Manual balance adjustment",
      },
    }),
  ]);

  return NextResponse.json({ ok: true, balance: Number(nextBalance), direction: body.data.direction });
}
