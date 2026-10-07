"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Money } from "@/components/Money";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  balance: number;
  createdAt: string;
  promoCode: string | null;
};

type PromoRow = {
  id: string;
  code: string;
  bonusAmount: number;
  bonusMode: string;
  isActive: boolean;
  isSingleUse: boolean;
  usageLimit: number | null;
  usageCount: number;
  note: string | null;
  expiresAt: string | null;
  createdBy: string;
};

export default function AdminPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [promos, setPromos] = useState<PromoRow[] | null>(null);
  const [promoForm, setPromoForm] = useState({ code: "", note: "", usageLimit: "", expiryHours: "", bonusAmount: "100", bonusMode: "SET_TO_100" });
  const [err, setErr] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = async () => {
    const [usersRes, promosRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/admin/promo")]);
    if (usersRes.status === 403 || promosRes.status === 403) return router.push("/dashboard");
    if (usersRes.ok) setUsers((await usersRes.json()).users || []);
    if (promosRes.ok) setPromos((await promosRes.json()).promos || []);
  };

  useEffect(() => {
    load();
  }, []);

  async function generatePromo() {
    setErr("");
    const res = await fetch("/api/admin/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: promoForm.code || undefined,
        note: promoForm.note || undefined,
        usageLimit: promoForm.usageLimit ? Number(promoForm.usageLimit) : undefined,
        expiryHours: promoForm.expiryHours ? Number(promoForm.expiryHours) : undefined,
        bonusAmount: Number(promoForm.bonusAmount || 100),
        bonusMode: promoForm.bonusMode,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data.error || "Promo code creation failed.");
    setPromoForm({ code: "", note: "", usageLimit: "", expiryHours: "", bonusAmount: "100", bonusMode: "SET_TO_100" });
    await load();
  }

  async function revokePromo(id: string) {
    const res = await fetch(`/api/admin/promo/${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  async function copyPromoCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode((current) => (current === code ? null : current)), 1500);
    } catch {
      setErr("Unable to copy promo code.");
    }
  }

  async function adjustBalance(id: string, direction: "INCREMENT" | "DECREMENT", amount: string) {
    const value = Number(amount);
    if (!value || value <= 0) return setErr("Enter an amount greater than zero.");
    const res = await fetch(`/api/admin/users/${id}/balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: value, direction, currency: "USD", reason: `${direction === "INCREMENT" ? "Increase" : "Decrease"} via admin panel` }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data.error || "Adjustment failed.");
    await load();
  }

  async function toggleUserStatus(id: string, status: "ACTIVE" | "SUSPENDED") {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: status === "SUSPENDED" ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: status === "ACTIVE" ? JSON.stringify({ status: "ACTIVE" }) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data.error || "User update failed.");
    await load();
  }

  if (!users || !promos) return <p className="px-4 py-8 text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900">Admin controls</h2>
        <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => router.push("/dashboard")}>Back</button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Generate promo code</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="xl:col-span-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Code</label>
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} placeholder="PV-ABCD-1234" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bonus amount (USD)</label>
            <input type="number" min="1" step="1" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={promoForm.bonusAmount} onChange={(e) => setPromoForm({ ...promoForm, bonusAmount: e.target.value })} placeholder="100" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Usage limit</label>
            <input type="number" min="1" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={promoForm.usageLimit} onChange={(e) => setPromoForm({ ...promoForm, usageLimit: e.target.value })} placeholder="Optional" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Expiry hours</label>
            <input type="number" min="1" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={promoForm.expiryHours} onChange={(e) => setPromoForm({ ...promoForm, expiryHours: e.target.value })} placeholder="Optional" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bonus mode</label>
            <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={promoForm.bonusMode} onChange={(e) => setPromoForm({ ...promoForm, bonusMode: e.target.value })}>
              <option value="SET_TO_100">Set balance to amount</option>
              <option value="ADD_100">Add amount to balance</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Note</label>
          <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={promoForm.note} onChange={(e) => setPromoForm({ ...promoForm, note: e.target.value })} placeholder="Optional label" />
        </div>

        <div className="mt-4">
          <button className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700" onClick={generatePromo}>Create promo</button>
        </div>
        <div className="mt-2 min-h-[22px] text-sm text-red-600">{err}</div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Promo codes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-sm text-slate-600">
                <th className="pb-3 pr-4 font-semibold">Code</th>
                <th className="pb-3 pr-4 font-semibold">Amount</th>
                <th className="pb-3 pr-4 font-semibold">Mode</th>
                <th className="pb-3 pr-4 font-semibold">Usage</th>
                <th className="pb-3 pr-4 font-semibold">Expiry</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => (
                <tr key={promo.id} className="border-t border-slate-200 align-top text-sm text-slate-800">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{promo.code}</span>
                      <button type="button" className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100" onClick={() => copyPromoCode(promo.code)}>{copiedCode === promo.code ? "Copied" : "Copy"}</button>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{promo.note}</div>
                  </td>
                  <td className="py-3 pr-4">${promo.bonusAmount.toFixed(2)}</td>
                  <td className="py-3 pr-4">{promo.bonusMode}</td>
                  <td className="py-3 pr-4">{promo.usageCount}{promo.usageLimit ? ` / ${promo.usageLimit}` : ""}</td>
                  <td className="py-3 pr-4">{promo.expiresAt ? new Date(promo.expiresAt).toLocaleString() : "Never"}</td>
                  <td className="py-3 pr-4">{promo.isActive ? "Active" : "Revoked"}</td>
                  <td className="py-3">
                    <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" disabled={!promo.isActive} onClick={() => revokePromo(promo.id)}>Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Registered users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-sm text-slate-600">
                <th className="pb-3 pr-4 font-semibold">User</th>
                <th className="pb-3 pr-4 font-semibold">Balance</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Promo</th>
                <th className="pb-3 pr-4 font-semibold">Adjust</th>
                <th className="pb-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-slate-200 align-top text-sm text-slate-800">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{user.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="py-3 pr-4"><Money amount={user.balance} /></td>
                  <td className="py-3 pr-4">{user.status}</td>
                  <td className="py-3 pr-4">{user.promoCode || "—"}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" step="0.01" placeholder="USD" id={`amount-${user.id}`} className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" />
                      <button className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" onClick={() => adjustBalance(user.id, "INCREMENT", (document.getElementById(`amount-${user.id}`) as HTMLInputElement | null)?.value || "0")}>+</button>
                      <button className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" onClick={() => adjustBalance(user.id, "DECREMENT", (document.getElementById(`amount-${user.id}`) as HTMLInputElement | null)?.value || "0")}>-</button>
                    </div>
                  </td>
                  <td className="py-3">
                    {user.role === "ADMIN" ? <span className="text-xs text-slate-500">Protected</span> : (
                      <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => toggleUserStatus(user.id, user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}>
                        {user.status === "ACTIVE" ? "Remove" : "Restore"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
