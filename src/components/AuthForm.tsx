"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", promoCode: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);

    const payload = signup ? { ...f, promoCode: f.promoCode.trim() } : { email: f.email, password: f.password };
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let d: any = {};
    try {
      d = await res.json();
    } catch {
      d = { error: "The server returned an empty or invalid response." };
    }

    setBusy(false);
    if (!res.ok) return setErr(d.error || "Something went wrong.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md overflow-hidden bg-white border shadow-xl rounded-2xl border-slate-200 shadow-slate-200/70">
        <div className="px-6 py-8 text-white bg-gradient-to-r from-blue-600 to-indigo-600">
          <p className="text-sm font-medium text-blue-100">Secure wallet access</p>
          <p className="mt-2 text-lg font-semibold">Payments, transfers, and everyday use.</p>
        </div>

        <form className="p-6 space-y-4" onSubmit={submit}>
          {signup && (
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700">Full name</label>
              <input className="w-full px-3 py-3 text-sm border rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">Email</label>
            <input type="email" className="w-full px-3 py-3 text-sm border rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-slate-700">Password (8+ characters)</label>
            <input type="password" className="w-full px-3 py-3 text-sm border rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete={signup ? "new-password" : "current-password"} />
          </div>

          {signup && (
            <div>
              <label className="block mb-1 text-sm font-medium text-slate-700">Promo code (optional)</label>
              <input className="w-full px-3 py-3 text-sm border rounded-xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100" value={f.promoCode} onChange={(e) => setF({ ...f, promoCode: e.target.value })} placeholder="Optional: PV-ABCD-1234" autoComplete="off" />
            </div>
          )}

          <div className="min-h-[22px] text-sm text-red-600">{err}</div>

          <button className="w-full px-4 py-3 font-semibold text-white transition bg-blue-600 shadow-sm rounded-xl hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={busy}>
            {busy ? "Please wait…" : signup ? "Create account" : "Log in"}
          </button>

          <p className="text-sm text-center text-slate-500">
            {signup ? (
              <>
                Have an account? <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">Log in</Link>
              </>
            ) : (
              <>
                New here? <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">Create an account</Link>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
