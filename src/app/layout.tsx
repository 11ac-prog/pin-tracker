import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pin Tracker",
  description: "Track your pin collection, trades, and worth",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/pins", label: "Collection" },
  { href: "/trades", label: "Trades" },
  { href: "/sold", label: "Sold" },
  { href: "/wishlist", label: "Wishlist" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="shrink-0 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-base font-black uppercase tracking-tight text-transparent sm:text-xl"
            >
              Pin.Tracker
            </Link>
            <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 transition hover:bg-white/5 hover:text-emerald-300"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="hidden shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
              Local
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
