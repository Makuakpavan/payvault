import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_REQUIRED") {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }
    throw error;
  }

  const promo = await db.promoCode.findUnique({ where: { id: params.id } });
  if (!promo) {
    return NextResponse.json({ error: "Promo code not found." }, { status: 404 });
  }

  await db.promoCode.update({
    where: { id: promo.id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true, revoked: promo.code });
}
