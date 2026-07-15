import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SectionLabel } from "@/components/site/Panel";
import { Github } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — MCreator Agent" },
      {
        name: "description",
        content:
          "Built by Nykoo. Open-source, local-first, modding-focused. A careful tool surface for MCreator workspaces.",
      },
      { property: "og:title", content: "About — MCreator Agent" },
      {
        property: "og:description",
        content: "Built by Nykoo. Open-source, local-first, modding-focused.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <SectionLabel>About</SectionLabel>
          <h1 className="text-5xl text-foreground md:text-6xl">
            Built for mod authors who want
            <span className="italic text-primary"> their tools, on their machine.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            MCreator Agent gives MCreator workspaces an assistant that actually understands them —
            through a small, typed MCP tool surface that's safe for agents to use.
          </p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl text-foreground">Principles</h2>
          <ul className="mt-6 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
            {[
              [
                "Built by Nykoo",
                "An independent project, crafted with care for the MCreator modding community.",
              ],
              [
                "Open-source",
                "MIT licensed. Read the source, audit it, extend it, contribute back.",
              ],
              [
                "Local-first",
                "Your workspace stays on your machine. No telemetry, no background uploads.",
              ],
              [
                "Modding-focused",
                "Designed around the way mod authors actually work — not a general-purpose code tool.",
              ],
              [
                "Agent-ready",
                "Every capability is a typed MCP tool — predictable, inspectable, safe to call.",
              ],
              [
                "Honest scope",
                "We describe what's implemented today. Planned and future work is labeled as such.",
              ],
            ].map(([t, d]) => (
              <li key={t} className="bg-background p-6">
                <div className="text-foreground">{t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{d}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl text-foreground">Scope</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            We aim to be useful and accurate. That means being clear about what MCreator Agent does
            today and what it doesn't.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="font-mono text-[11px] uppercase tracking-wider text-primary">
                In scope
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
                <li>A typed MCP surface for real MCreator workspaces.</li>
                <li>Validated support for MCreator versions, starting with 2024.4.</li>
                <li>
                  GeckoLib diagnostics, asset import, create/update, single-element generate, and
                  validation.
                </li>
                <li>Strict local-first defaults.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Out of scope
              </div>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                <li>Support claims for MCreator versions we haven't validated.</li>
                <li>Full end-to-end animation authoring or rigging.</li>
                <li>Telemetry or background network calls.</li>
                <li>Positioning MCreator Agent as a replacement for MCreator itself.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl text-foreground">Project</h2>
          <p className="mt-3 text-muted-foreground">
            Crafted by <span className="text-foreground">Nykoo</span>. Released under the MIT
            license. Not affiliated with the MCreator project — we build alongside it, for the same
            community.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://github.com/Nxkoo/MCreator-Agent"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" /> Source on GitHub
            </a>
            <Link
              to="/docs/quickstart"
              className="inline-flex items-center gap-2 rounded border border-primary/40 bg-primary/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary hover:bg-primary/20"
            >
              Start quickstart
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
