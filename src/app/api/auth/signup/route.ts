import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { SUPPORTED_CURRENCIES } from "@/lib/money";

const schema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
  promoCode: z.string().trim().optional().default(""),
});

export async function POST(req: Request) {
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) {
    return NextResponse.json({ error: "Enter your name, a valid email, and a strong password." }, { status: 400 });
  }

  if (await db.user.findUnique({ where: { email: p.data.email } })) {
    return NextResponse.json({ error: "This email already has an account. Log in instead." }, { status: 409 });
  }

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: p.data.name,
        email: p.data.email,
        passwordHash: await bcrypt.hash(p.data.password, 12),
        balance: 0n,
        lastAppliedPromo: null,
      },
    });

    await tx.wallet.createMany({
      data: SUPPORTED_CURRENCIES.map((currency) => ({ userId: created.id, currency, balance: 0n })),
      skipDuplicates: true,
    });

    return created;
  });

  await setSession(user.id);
  return NextResponse.json({ ok: true });
}
