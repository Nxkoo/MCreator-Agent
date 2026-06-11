import { Link, useRouterState } from "@tanstack/react-router";
import { Github, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/docs", label: "Docs" },
  { to: "/docs/quickstart", label: "Quickstart" },
  { to: "/docs/tools", label: "Tools" },
  { to: "/docs/geckolib", label: "GeckoLib" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/docs" ? path === "/docs" : path.startsWith(to));

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="MCreator Agent" className="h-7 w-7" />
          <span className="text-[15px] tracking-tight text-foreground">
            <span className="font-display italic">MCreator</span>
            <span className="ml-1 font-sans font-medium">Agent</span>
          </span>
          <span className="ml-2 hidden rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-block">
            1.0.0-2024.4 · preview
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV.map((n) => {
            const active = isActive(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`relative rounded px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                }`}
              >
                {n.label}
                {active && <span className="absolute inset-x-2 -bottom-[5px] h-px bg-primary" />}
              </Link>
            );
          })}
          <a
            href="https://github.com/Nxkoo/MCreator-Agent"
            target="_blank"
            rel="noreferrer"
            className="ml-3 inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            aria-label="GitHub repository"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded border border-border md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`py-2 font-mono text-xs uppercase tracking-wider ${
                  isActive(n.to) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <a
              href="https://github.com/Nxkoo/MCreator-Agent"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-2 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground"
            >
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
