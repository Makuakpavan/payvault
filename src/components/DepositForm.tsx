"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/lib/money";

const luhn = (n: string) => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = +n[i]; if (d) { x *= 2; if (x > 9) x -= 9; } s += x; d = !d; } return s % 10 === 0; };

function PasswordField({
  label,
  value,
  maxLength,
  placeholder,
  show,
  onToggle,
  onChange,
}: {
  label: string;
  value: string;
  maxLength?: number;
  placeholder?: string;
  show: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} inputMode="numeric" maxLength={maxLength} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 pr-14 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))} />
        <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={onToggle} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-lg text-blue-600 transition hover:bg-blue-50">
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );
}

export default function DepositForm() {
  const router = useRouter();
  const [f, setF] = useState({ currency: "USD", amount: "", promoCode: "", note: "", name: "", card: "", exp: "", cvv: "", pin: "" });
  const [show, setShow] = useState({ cvv: false, pin: false });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [promoMessage, setPromoMessage] = useState("Apply a valid promo code to unlock your deposit.");
  const [promoApplied, setPromoApplied] = useState(false);
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function applyPromo() {
    const code = f.promoCode.trim();
    if (!code) return setPromoMessage("Enter a promo code first.");

    const res = await fetch("/api/promo/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ promoCode: code }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPromoApplied(false);
      setPromoMessage(data.error || "Promo code is invalid.");
      return;
    }

    setPromoApplied(true);
    setPromoMessage(data.message || "Promo code applied. Welcome bonus granted.");
  }

  async function pay() {
    if (!promoApplied) return setErr("Apply a valid promo code before paying.");

    const a = parseFloat(f.amount), num = f.card.replace(/\s/g, ""), m = /^(\d\d)(\d\d)$/.exec(f.exp);
    if (!(a > 0)) return setErr("Enter an amount greater than 0.");
    if (!f.name.trim()) return setErr("Enter the name on the card.");
    if (num.length < 13 || !luhn(num)) return setErr("Card number is not valid.");
    if (!m || +m[1] < 1 || +m[1] > 12 || new Date(2000 + +m[2], +m[1], 0, 23, 59) < new Date()) return setErr("Expiry date is invalid or has passed.");
    if (!/^\d{3,4}$/.test(f.cvv)) return setErr("Enter the 3 or 4 digit CVV.");
    if (!/^\d{4}$/.test(f.pin)) return setErr("Enter a valid 4-digit card PIN.");

    setErr("");
    setBusy(true);
    const res = await fetch("/api/deposit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currency: f.currency, amount: a, cardLast4: num.slice(-4), reference: crypto.randomUUID(), promoCode: f.promoCode, notes: f.note }) });
    if (!res.ok) {
      setBusy(false);
      const data = await res.json().catch(() => ({}));
      return setErr(data.error || "Deposit failed.");
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900">Deposit</h2>
        <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => router.push("/dashboard")}>Back</button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Apply promo code</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={f.promoCode} onChange={(e) => set("promoCode", e.target.value)} placeholder="e.g. PV-ABCD-1234" autoComplete="off" />
            <button type="button" className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700" onClick={applyPromo}>Apply</button>
          </div>
          <div className={`mt-2 text-sm ${promoApplied ? "text-emerald-600" : "text-slate-500"}`}>{promoMessage}</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
            <select className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={f.currency} onChange={(e) => set("currency", e.target.value)}>{Object.entries(CURRENCIES).map(([k, v]) => <option key={k} value={k}>{k} – {v}</option>)}</select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
            <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={f.amount} onChange={(e) => set("amount", e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Deposit note</label>
            <textarea className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="Optional note for the payment" rows={3} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name on card</label>
            <input autoComplete="cc-name" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={f.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Card number</label>
            <input inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={f.card} onChange={(e) => set("card", e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim())} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Expiry (MM/YY)</label>
              <input inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={f.exp} onChange={(e) => set("exp", e.target.value.replace(/\D/g, "").slice(0, 4).replace(/^(\d\d)(\d)/, "$1/$2"))} />
            </div>
            <div>
              <PasswordField label="CVV" value={f.cvv} maxLength={4} show={show.cvv} onToggle={() => setShow((s) => ({ ...s, cvv: !s.cvv }))} onChange={(value) => set("cvv", value)} />
            </div>
          </div>

          <PasswordField label="Card PIN" value={f.pin} maxLength={4} placeholder="1234" show={show.pin} onToggle={() => setShow((s) => ({ ...s, pin: !s.pin }))} onChange={(value) => set("pin", value)} />
        </div>

        <div className="mt-4 min-h-[22px] text-sm text-red-600">{err}</div>
        <button className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={busy || !promoApplied} onClick={pay}>{busy ? "Processing…" : "Pay now"}</button>
      </div>
    </div>
  );
}
