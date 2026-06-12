import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  BookOpen,
  Rocket,
  Download,
  Plug,
  Terminal,
  Boxes,
  Network,
  LifeBuoy,
  Github,
  ScrollText,
  BookMarked,
} from "lucide-react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { DocsSearch } from "./DocsSearch";

const GROUPS = [
  {
    label: "Get started",
    items: [
      { to: "/docs", label: "Introduction", Icon: BookOpen },
      { to: "/docs/quickstart", label: "Quickstart", Icon: Rocket },
      { to: "/docs/installation", label: "Installation", Icon: Download },
    ],
  },
  {
    label: "Usage",
    items: [
      { to: "/docs/mcp-clients", label: "MCP Clients", Icon: Plug },
      { to: "/docs/tools", label: "Tools", Icon: Terminal },
      { to: "/docs/geckolib", label: "GeckoLib", Icon: Boxes },
    ],
  },
  {
    label: "Resources",
    items: [{ to: "/docs/mcreator-skill", label: "MCreator Skill", Icon: BookMarked }],
  },
  {
    label: "Reference",
    items: [
      { to: "/docs/architecture", label: "Architecture", Icon: Network },
      { to: "/docs/troubleshooting", label: "Troubleshooting", Icon: LifeBuoy },
      { to: "/docs/changelog", label: "Changelog", Icon: ScrollText },
      { to: "/docs/release-guide", label: "Release Guide", Icon: ScrollText },
    ],
  },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Documentation" className="space-y-6">
      <DocsSearch />

      {GROUPS.map((g) => (
        <div key={g.label}>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {g.label}
          </div>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const active = path === it.to;
              const Icon = it.Icon;
              return (
                <li key={it.to}>
                  <Link
                    to={it.to}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-sm border-l-2 px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-accent/40 hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${active ? "text-primary" : "text-muted-foreground"}`}
                      aria-hidden="true"
                    />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="space-y-3 border-t border-border/60 pt-5">
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
            1.0.0-2024.4 · Preview
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Preview APIs may change before the first stable compatibility contract.
          </p>
        </div>
        <a
          href="https://github.com/Nxkoo/MCreator-Agent/issues"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md border border-border bg-surface/50 p-3 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Github className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          Need help? Open a GitHub issue
        </a>
      </div>
    </nav>
  );
}

export function DocsLayout({
  children,
  title,
  eyebrow,
}: {
  children: ReactNode;
  title: string;
  eyebrow?: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto flex max-w-7xl px-4 sm:px-6">
        <aside className="hidden w-64 shrink-0 border-r border-border/60 py-10 pr-6 md:block">
          <div className="sticky top-20">
            <Sidebar />
          </div>
        </aside>

        <div className="min-w-0 flex-1 py-8 md:py-12 md:pl-10">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <button
              onClick={() => setOpen(true)}
              aria-label="Open documentation menu"
              className="inline-flex items-center gap-2 rounded border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Menu className="h-3.5 w-3.5" aria-hidden="true" /> Docs menu
            </button>
          </div>

          <article className="max-w-3xl">
            {eyebrow && (
              <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                {eyebrow}
              </div>
            )}
            <h1 className="border-b border-line pb-4 text-4xl text-foreground md:text-5xl">
              {title}
            </h1>
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-foreground/90">
              {children}
            </div>
          </article>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Documentation menu"
        >
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-border bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Documentation
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close documentation menu"
                className="rounded p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
