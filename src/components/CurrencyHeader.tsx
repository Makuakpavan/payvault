"use client";

export function CurrencyHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-5 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-black text-white shadow-lg shadow-blue-200">
          P
        </div>
        <div className="text-lg font-bold text-slate-900">PayVault</div>
      </div>
    </header>
  );
}
