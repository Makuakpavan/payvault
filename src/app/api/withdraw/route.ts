import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { CODES, toMinor } from "@/lib/money";

const schema = z.object({
  currency: z.enum(CODES),
  amount: z.number().positive(),
  reference: z.string().min(8),
  bankName: z.string().trim().min(1).optional().or(z.literal("")),
  accountName: z.string().trim().min(1).optional().or(z.literal("")),
  accountNumber: z.string().trim().min(1).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please complete all withdrawal details before confirming." }, { status: 400 });
  const amount = BigInt(toMinor(p.data.amount, p.data.currency));
  if (amount <= BigInt(0)) return NextResponse.json({ error: "Amount is too small." }, { status: 400 });
  const bankName = p.data.bankName?.trim() || null;
  const accountName = p.data.accountName?.trim() || null;
  const accountNumber = p.data.accountNumber?.trim() || null;
  const notes = p.data.notes?.trim() || null;
  if (!bankName || !accountName || !accountNumber) return NextResponse.json({ error: "Please provide your bank name, account holder name, and account number." }, { status: 400 });

  try {
    await db.$transaction(async (tx) => {
      const r = await tx.wallet.updateMany({ where: { userId: user.id, currency: p.data.currency, balance: { gte: amount } }, data: { balance: { decrement: amount } } });
      if (r.count === 0) throw new Error("INSUFFICIENT");
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAWAL",
          status: "PENDING",
          currency: p.data.currency,
          amount,
          reference: p.data.reference,
          bankName,
          accountName,
          accountNumber,
          notes,
        },
      });
    });
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT") return NextResponse.json({ error: "Amount is more than your balance." }, { status: 400 });
    if (e?.code === "P2002") return NextResponse.json({ error: "This withdrawal was already submitted." }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ ok: true, status: "PENDING" });
}
