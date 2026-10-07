import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { SUPPORTED_CURRENCIES } from "@/lib/money";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const [wallets, txs] = await Promise.all([
    db.wallet.findMany({ where: { userId: user.id } }),
    db.transaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const walletMap = new Map(wallets.map((w) => [w.currency, Number(w.balance)]));
  const walletList = SUPPORTED_CURRENCIES.map((currency) => ({
    currency,
    balance: Number(walletMap.get(currency) ?? 0),
  }));

  const lastDeposit = txs.find((t) => t.type === "DEPOSIT" && t.status === "COMPLETED");

  return NextResponse.json({
    name: user.name,
    isAdmin: user.role === "ADMIN",
    balance: Number(user.balance),
    active: lastDeposit?.currency ?? walletList.find((w) => w.balance > 0)?.currency ?? "USD",
    promoApplied: Boolean(user.lastAppliedPromo),
    wallets: walletList,
    transactions: txs.map((t) => ({
      id: t.id,
      type: t.type,
      status: t.status,
      currency: t.currency,
      amount: Number(t.amount),
      cardLast4: t.cardLast4,
      createdAt: t.createdAt,
      reference: t.reference,
    })),
  });
}
