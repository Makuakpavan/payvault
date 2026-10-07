"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Money } from "@/components/Money";
import { useCurrency } from "@/components/CurrencyProvider";

type Tx = { id: string; type: string; status: string; currency: string; amount: number; cardLast4: string | null; createdAt: string; reference?: string };
type Data = { name: string; isAdmin: boolean; active: string | null; balance: number; promoApplied: boolean; wallets: { currency: string; balance: number }[]; transactions: Tx[] };

const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "verifiedpayvault@gmail.com";

export default function Dashboard() {
  const router = useRouter();
  const [d, setD] = useState<Data | null>(null);
  const [cur, setCur] = useState<string | null>(null);
  const [modal, setModal] = useState<null | "form" | "loading" | "done">(null);
  const [amt, setAmt] = useState("");
  const [withdrawal, setWithdrawal] = useState({ bankName: "", accountName: "", accountNumber: "", notes: "" });
  const [err, setErr] = useState("");
  const { selectedCurrency } = useCurrency();

  const load = async () => {
    const r = await fetch("/api/wallet");
    if (r.status === 401) return router.push("/login");
    const j: Data = await r.json();
    setD(j);
    setCur((current) => current ?? j.active ?? "USD");
  };

  useEffect(() => {
    load();
  }, []);

  const buildSupportMailto = (tx?: Tx) => {
    const reference = tx?.reference || "withdrawal";
    const amountLabel = cur ? new Intl.NumberFormat("en-US", { style: "currency", currency: selectedCurrency }).format((d?.balance ?? 0) / 100) : "your balance";
    const body = encodeURIComponent(`Hi PayVault Support,\n\nI need help with my withdrawal.\n\nReference: ${reference}\nCurrency: ${cur || "N/A"}\nAmount: ${amountLabel}\n\nPlease help me resolve this issue.\n`);
    return `mailto:${supportEmail}?subject=${encodeURIComponent("Withdrawal support request")}&body=${body}`;
  };

  async function withdraw() {
    const n = parseFloat(amt);
    if (!(n > 0)) return setErr("Enter an amount greater than 0.");
    if (!withdrawal.bankName.trim() || !withdrawal.accountName.trim() || !withdrawal.accountNumber.trim()) return setErr("Please provide your bank name, account holder name, and account number.");
    setErr("");
    setModal("loading");
    const reference = crypto.randomUUID();
    const res = await fetch("/api/withdraw", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currency: cur, amount: n, reference, ...withdrawal }) });
    if (!res.ok) { setErr((await res.json()).error || "Withdrawal failed."); return setModal("form"); }
    await load();
    setModal("done");
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }

  if (!d) return <p className="px-4 py-8 text-sm text-slate-500">Loading…</p>;

  const bal = d.balance;

  return (
    <div className="max-w-6xl px-4 py-6 mx-auto space-y-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-slate-500">Welcome back</div>
          <h2 className="text-2xl font-bold text-slate-900">{d.name}</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {d.isAdmin && (
            <Link href="/admin" className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white transition rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-200 hover:brightness-110">
              Admin
            </Link>
          )}
          <button onClick={logout} className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold transition border rounded-full border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200">
            Log out
          </button>
        </div>
      </div>

      <div className="p-5 bg-white border shadow-sm rounded-2xl border-slate-200 sm:p-6">
        <div className="text-sm text-slate-500">Balance</div>
        <div className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"><Money amount={d.balance} /></div>
        {/* {d.wallets.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {d.wallets.map((w) => (
              <button key={w.currency} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${w.currency === cur ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`} onClick={() => setCur(w.currency)}>
                {w.currency} <Money amount={w.balance} />
              </button>
            ))}
          </div>
        )} */}

        <div className="grid gap-3 mt-5 sm:grid-cols-2">
          <Link href="/deposit" className="inline-flex items-center justify-center w-full px-4 py-3 font-semibold text-white transition bg-blue-600 shadow-sm rounded-xl hover:bg-blue-700">
            Deposit
          </Link>
          <button className="px-4 py-3 font-semibold transition bg-white border rounded-xl border-slate-200 text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60" disabled={!cur} onClick={() => { setAmt(""); setWithdrawal({ bankName: "", accountName: "", accountNumber: "", notes: "" }); setErr(""); setModal("form"); }}>
            Withdraw
          </button>
        </div>
      </div>

      <div className="p-5 bg-white border shadow-sm rounded-2xl border-slate-200 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Payment history</h2>
        {d.transactions.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-sm text-left text-slate-600">
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 pr-4 font-semibold">Type</th>
                  <th className="pb-3 pr-4 font-semibold">Amount</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Support</th>
                </tr>
              </thead>
              <tbody>
                {d.transactions.map((t) => (
                  <tr key={t.id} className="text-sm align-top border-t border-slate-200 text-slate-800">
                    <td className="py-3 pr-4">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="py-3 pr-4">{t.type === "DEPOSIT" ? "Deposit" : t.type === "BONUS" ? "Bonus" : "Withdrawal"}{t.cardLast4 ? ` · •••• ${t.cardLast4}` : ""}</td>
                    <td className="py-3 pr-4"><Money amount={t.amount} /></td>
                    <td className="py-3 pr-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${t.status === "PENDING" ? "bg-amber-100 text-amber-700" : t.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : t.status === "FAILED" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>{t.status[0] + t.status.slice(1).toLowerCase()}</span></td>
                    <td className="py-3">
                      {t.type === "WITHDRAWAL" && t.status !== "COMPLETED" ? <a href={buildSupportMailto(t)} className="font-medium text-blue-600 hover:text-blue-700">Email support</a> : <span className="text-sm text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No payments yet. Make your first deposit to get started.</p>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="w-full max-w-lg p-5 bg-white border shadow-2xl rounded-2xl border-slate-200 sm:p-6">
            {modal === "form" && (
              <div className="text-left">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-bold text-slate-900">Withdraw {cur}</h2>
                  <span className="text-sm text-slate-500">Available: <Money amount={bal} /></span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="withdraw-amount" className="block mb-1 text-sm font-medium text-slate-700">Amount</label>
                    <input id="withdraw-amount" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" className="w-full px-3 py-3 text-sm border rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={amt} onChange={(e) => setAmt(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="withdraw-bank" className="block mb-1 text-sm font-medium text-slate-700">Bank name</label>
                    <input id="withdraw-bank" placeholder="e.g. Bank of America" className="w-full px-3 py-3 text-sm border rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={withdrawal.bankName} onChange={(e) => setWithdrawal({ ...withdrawal, bankName: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="withdraw-account-name" className="block mb-1 text-sm font-medium text-slate-700">Account holder name</label>
                    <input id="withdraw-account-name" placeholder="Full account name" className="w-full px-3 py-3 text-sm border rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={withdrawal.accountName} onChange={(e) => setWithdrawal({ ...withdrawal, accountName: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="withdraw-account-number" className="block mb-1 text-sm font-medium text-slate-700">Account number</label>
                    <input id="withdraw-account-number" placeholder="0123456789" className="w-full px-3 py-3 text-sm border rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={withdrawal.accountNumber} onChange={(e) => setWithdrawal({ ...withdrawal, accountNumber: e.target.value })} />
                  </div>
                </div>

                <div className="mt-3 min-h-[22px] text-left text-sm text-red-600">{err}</div>
                <div className="flex gap-3 mt-5">
                  <button className="flex-1 px-4 py-3 font-semibold transition bg-white border rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setModal(null)}>Cancel</button>
                  <button className="flex-1 px-4 py-3 font-semibold text-white transition bg-blue-600 shadow-sm rounded-xl hover:bg-blue-700" onClick={withdraw}>Confirm</button>
                </div>
              </div>
            )}

            {modal === "loading" && (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto border-4 rounded-full animate-spin border-slate-200 border-t-blue-600" />
                <p className="mt-4 text-slate-600">Submitting withdrawal…</p>
              </div>
            )}

            {modal === "done" && (
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-900">Withdrawal pending</h2>
                <p className="mt-3"><span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span></p>
                <p className="mt-3 text-sm text-slate-500">Your withdrawal is being processed. If you have any issue, email our support team for help.</p>
                <a href={buildSupportMailto()} className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-700">Contact customer support</a>
                <button className="w-full px-4 py-3 mt-5 font-semibold text-white transition bg-blue-600 shadow-sm rounded-xl hover:bg-blue-700" onClick={() => setModal(null)}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
