import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }
    throw error;
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      promoCode: { select: { code: true, note: true } },
    },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      balance: Number(user.balance),
      createdAt: user.createdAt,
      promoCode: user.promoCode?.code ?? null,
      promoNote: user.promoCode?.note ?? null,
    })),
  });
}
