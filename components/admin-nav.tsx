"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", hint: "Statistics" },
  { href: "/users", label: "Users", hint: "Read" },
  { href: "/captions", label: "AI captions", hint: "Create · Read · Update · Delete" },
  { href: "/votes", label: "Votes", hint: "Read" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map(({ href, label, hint }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3 py-2 transition ${
              active ? "bg-white/10 text-white" : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="block text-sm font-medium">{label}</span>
            <span className="hidden text-[11px] text-[var(--muted)] lg:block">{hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}
