import Link from "next/link";
import type { ReactNode } from "react";

interface PageShellProps {
  title: string;
  description: string;
  children?: ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/session/new", label: "New Session" },
  { href: "/session/log", label: "Log Session" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
  { href: "/import", label: "Import" },
];

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <main className="min-h-screen bg-stone-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-4 border-b border-stone-300 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-600">
              Bench Coach
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-stone-900">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">
              {description}
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-stone-300 px-3 py-1.5 text-stone-700 transition hover:border-stone-500 hover:text-stone-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
