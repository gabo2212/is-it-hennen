"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Diapos" },
  { href: "/detect", label: "Détecteur" },
  { href: "/docs", label: "Docs" },
] as const;

export function SiteNav({
  eyebrow,
  right,
  className,
}: {
  eyebrow?: string;
  right?: ReactNode;
  className?: string;
}) {
  const path = usePathname();

  return (
    <header
      className={cn(
        "relative z-10 flex items-center justify-between gap-4 px-5 py-4 sm:px-8",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/"
          className="shrink-0 font-display text-sm italic tracking-wide text-lime"
        >
          C'est Hennen ?
        </Link>
        {eyebrow && (
          <span className="hidden truncate text-xs uppercase tracking-[0.18em] text-ink-400 sm:inline">
            {eyebrow}
          </span>
        )}
      </div>
      <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
        {LINKS.map((link) => {
          const active =
            link.href === "/"
              ? path === "/"
              : path === link.href || path.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider",
                active
                  ? "bg-lime text-ink-950"
                  : "border border-white/15 bg-white/5 text-ink-200 hover:bg-white/10",
              )}
            >
              {link.label}
            </Link>
          );
        })}
        {right}
      </nav>
    </header>
  );
}
