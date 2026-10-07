import "./globals.css";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { CurrencyHeader } from "@/components/CurrencyHeader";

export const metadata = { title: "PayVault", description: "Multi-currency wallet" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-[#eef2f6] text-slate-900">
        <CurrencyProvider>
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
            <CurrencyHeader />
            <main className="w-full flex-1 px-3 pb-8 sm:px-5 lg:px-6">{children}</main>
          </div>
        </CurrencyProvider>
      </body>
    </html>
  );
}
