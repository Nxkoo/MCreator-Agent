import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type Group = "Pages" | "Tools" | "Setup" | "Troubleshooting" | "Changelog";
type Entry = { title: string; hint: string; to: string; group: Group; boost?: number };

const INDEX: Entry[] = [
  // Pages
  { group: "Pages", title: "Introduction", hint: "What MCreator Agent is", to: "/docs" },
  {
    group: "Pages",
    title: "Quickstart",
    hint: "Install, connect, first tool call",
    to: "/docs/quickstart",
    boost: 2,
  },
  {
    group: "Pages",
    title: "Installation",
    hint: "Download or build plugin ZIP",
    to: "/docs/installation",
  },
  {
    group: "Pages",
    title: "MCP Clients",
    hint: "Claude, Cursor, Codex, generic",
    to: "/docs/mcp-clients",
    boost: 2,
  },
  { group: "Pages", title: "Tools", hint: "Typed MCP tool reference", to: "/docs/tools" },
  {
    group: "Pages",
    title: "GeckoLib",
    hint: "Diagnostics, import, validate",
    to: "/docs/geckolib",
  },
  {
    group: "Pages",
    title: "MCreator Skill",
    hint: "Standalone agent guidance and MCP pairing",
    to: "/docs/mcreator-skill",
    boost: 2,
  },
  {
    group: "Pages",
    title: "Architecture",
    hint: "Local-only diagram and safety model",
    to: "/docs/architecture",
  },
  {
    group: "Pages",
    title: "Troubleshooting",
    hint: "Common issues and fixes",
    to: "/docs/troubleshooting",
  },
  {
    group: "Pages",
    title: "Release Guide",
    hint: "1.0.0-2024.4 release checklist",
    to: "/docs/release-guide",
  },
  {
    group: "Pages",
    title: "Contributing",
    hint: "Fork, PR, run the site locally",
    to: "/contributing",
  },

  // Tools — boosted because exact name matches matter most
  {
    group: "Tools",
    title: "getWorkspaceInfo",
    hint: "READ · workspace metadata",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "listModElements",
    hint: "READ · list elements",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "createElement",
    hint: "WRITE · create element",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "deleteElement",
    hint: "WRITE · delete element",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "setModElementLock",
    hint: "WRITE · set code lock state",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "generateModElement",
    hint: "WRITE · generate one element",
    to: "/docs/tools",
    boost: 4,
  },
  {
    group: "Tools",
    title: "regenerateCode",
    hint: "ACTION · full workspace regen (risky)",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "buildWorkspace",
    hint: "ACTION · build + mutation report",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "runClient",
    hint: "ACTION · launch Minecraft client",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "runServer",
    hint: "ACTION · launch Minecraft server",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "getGeckoLibStatus",
    hint: "GECKOLIB · plugin status",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "listGeckoLibAssets",
    hint: "GECKOLIB · enumerate assets",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "importGeckoLibAssets",
    hint: "GECKOLIB · import assets",
    to: "/docs/tools",
    boost: 3,
  },
  {
    group: "Tools",
    title: "createGeckoLibElement",
    hint: "GECKOLIB · create (+ optional generateCode)",
    to: "/docs/geckolib",
    boost: 4,
  },
  {
    group: "Tools",
    title: "updateGeckoLibElement",
    hint: "GECKOLIB · update definition",
    to: "/docs/geckolib",
    boost: 4,
  },
  {
    group: "Tools",
    title: "validateGeckoLibElement",
    hint: "GECKOLIB · validate assets/codegen",
    to: "/docs/geckolib",
    boost: 3,
  },

  // Setup
  {
    group: "Setup",
    title: "Manual install",
    hint: "Download/build plugin ZIP",
    to: "/docs/installation",
  },
  {
    group: "Setup",
    title: "Java 21+ requirement",
    hint: "Confirm java -version",
    to: "/docs/installation",
  },
  {
    group: "Setup",
    title: "Generic MCP HTTP endpoint",
    hint: "http://localhost:5175/mcp",
    to: "/docs/mcp-clients",
  },
  {
    group: "Setup",
    title: "Claude Desktop config",
    hint: "Add URL server entry",
    to: "/docs/mcp-clients",
  },
  { group: "Setup", title: "Cursor config", hint: "MCP server URL", to: "/docs/mcp-clients" },
  {
    group: "Setup",
    title: "Port discovery",
    hint: "Read status or port file",
    to: "/docs/mcp-clients",
  },
  {
    group: "Setup",
    title: "Verify endpoint",
    hint: "curl the local /mcp endpoint",
    to: "/docs/mcp-clients",
    boost: 2,
  },

  // Troubleshooting
  {
    group: "Troubleshooting",
    title: "Plugin doesn't load",
    hint: "Confirm enabled and restart",
    to: "/docs/troubleshooting",
  },
  {
    group: "Troubleshooting",
    title: "Workspace not detected",
    hint: "Open a workspace in MCreator",
    to: "/docs/troubleshooting",
  },
  {
    group: "Troubleshooting",
    title: "MCP client cannot connect",
    hint: "Check port and config",
    to: "/docs/troubleshooting",
  },
  {
    group: "Troubleshooting",
    title: "No workspace loaded",
    hint: "Open a workspace before tool calls",
    to: "/docs/troubleshooting",
  },
  {
    group: "Troubleshooting",
    title: "GeckoLib tools unavailable",
    hint: "Install the GeckoLib plugin",
    to: "/docs/troubleshooting",
  },
  {
    group: "Troubleshooting",
    title: "Build / regenerate errors",
    hint: "Run from MCreator UI first",
    to: "/docs/troubleshooting",
  },

  // Changelog
  {
    group: "Changelog",
    title: "Release notes",
    hint: "1.0.0-2024.4 preview and future updates",
    to: "/docs/changelog",
  },
  {
    group: "Changelog",
    title: "Release checklist",
    hint: "Cut a new version",
    to: "/docs/release-guide",
    boost: 2,
  },
];

const FILTERS: ("All" | Group)[] = [
  "All",
  "Pages",
  "Tools",
  "Setup",
  "Troubleshooting",
  "Changelog",
];

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const q = query.trim();
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/25 px-0.5 text-primary">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function score(entry: Entry, q: string): number {
  const base = entry.boost ?? 0;
  if (!q) return base;
  const ql = q.toLowerCase();
  const t = entry.title.toLowerCase();
  const h = entry.hint.toLowerCase();
  if (t === ql) return 1000 + base;
  if (t.startsWith(ql)) return 500 + base;
  if (t.includes(ql)) {
    const wordBoost = new RegExp(`\\b${ql.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(t)
      ? 50
      : 0;
    return 200 + wordBoost + base;
  }
  if (entry.group === "Tools" && t.toLowerCase().includes(ql)) return 180 + base;
  if (h.includes(ql)) return 60 + base;
  return -1; // demote: no match
}

// URL state — uses window.history directly to avoid touching per-route search schemas.
function readUrlState(): { q: string; f: (typeof FILTERS)[number] } {
  if (typeof window === "undefined") return { q: "", f: "All" };
  const sp = new URLSearchParams(window.location.search);
  const q = sp.get("q") ?? "";
  const f = sp.get("f");
  const filter = (FILTERS as string[]).includes(f ?? "") ? (f as (typeof FILTERS)[number]) : "All";
  return { q, f: filter };
}

function writeUrlState(q: string, f: (typeof FILTERS)[number], open: boolean) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (open && q) url.searchParams.set("q", q);
  else url.searchParams.delete("q");
  if (open && f !== "All") url.searchParams.set("f", f);
  else url.searchParams.delete("f");
  window.history.replaceState(window.history.state, "", url.toString());
}

export function DocsSearch() {
  const initial = useRef<{ q: string; f: (typeof FILTERS)[number] } | null>(null);
  if (initial.current === null) initial.current = readUrlState();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(initial.current.q);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(initial.current.f);
  const navigate = useNavigate();

  // Auto-open if the URL arrived with a query or filter (e.g. shared link).
  useEffect(() => {
    if (initial.current && (initial.current.q || initial.current.f !== "All")) {
      setOpen(true);
    }
  }, []);

  // Persist to URL.
  useEffect(() => {
    writeUrlState(query, filter, open);
  }, [query, filter, open]);

  // Restore on back/forward.
  useEffect(() => {
    const onPop = () => {
      const next = readUrlState();
      setQuery(next.q);
      setFilter(next.f);
      if (next.q || next.f !== "All") setOpen(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ranked = useMemo(() => {
    const pool = filter === "All" ? INDEX : INDEX.filter((e) => e.group === filter);
    const q = query.trim();
    const scored = pool
      .map((e) => ({ e, s: score(e, q) }))
      .filter((x) => (q ? x.s >= 0 : true))
      .sort((a, b) => b.s - a.s);
    return scored.map((x) => x.e);
  }, [filter, query]);

  const groups = useMemo(() => {
    const seen: Group[] = [];
    for (const e of ranked) if (!seen.includes(e.group)) seen.push(e.group);
    return seen;
  }, [ranked]);

  const go = useCallback(
    (to: string) => {
      setOpen(false);
      navigate({ to });
    },
    [navigate],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search documentation"
        aria-keyshortcuts="Meta+K Control+K"
        className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface/60 px-3 py-2 text-left text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          Search docs…
        </span>
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Search pages, tools, setup steps…"
          value={query}
          onValueChange={setQuery}
          aria-label="Search documentation"
        />
        <div
          role="toolbar"
          aria-label="Filter by category"
          className="flex flex-wrap gap-1 border-b border-border px-2 py-2"
        >
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={active}
                className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((g, gi) => (
            <div key={g}>
              {gi > 0 && <CommandSeparator />}
              <CommandGroup heading={g}>
                {ranked
                  .filter((e) => e.group === g)
                  .map((e) => (
                    <CommandItem
                      key={`${e.group}-${e.title}-${e.to}`}
                      value={`${e.title} ${e.hint} ${e.group} ${e.to}`}
                      onSelect={() => go(e.to)}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                          <Highlight text={e.title} query={query} />
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <Highlight text={e.hint} query={query} />
                        </span>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
        <div className="border-t border-border px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="mr-3">↑↓ navigate</span>
          <span className="mr-3">↵ open</span>
          <span className="mr-3">esc close</span>
          <span className="text-foreground/60">filters and query sync to URL</span>
        </div>
      </CommandDialog>
    </>
  );
}
