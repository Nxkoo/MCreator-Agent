import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Boxes,
  Cpu,
  FileCode2,
  Github,
  Layers,
  Lock,
  Network,
  PlayCircle,
  ShieldCheck,
  Terminal,
  Wrench,
} from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TerminalPanel } from "@/components/site/TerminalPanel";
import { TryTool } from "@/components/site/TryTool";
import { WorkspacePanel } from "@/components/site/WorkspacePanel";
import { SectionLabel } from "@/components/site/Panel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MCreator Agent — Local-first MCP server for MCreator workspaces" },
      {
        name: "description",
        content:
          "A local-first MCP server that gives Claude, Cursor, Codex, and other MCP clients a typed tool surface for MCreator workspaces.",
      },
      { property: "og:title", content: "MCreator Agent — Local-first MCP server for MCreator" },
      {
        property: "og:description",
        content:
          "A local-first MCP server that gives MCP-compatible AI clients a typed tool surface for MCreator workspaces.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

type ToolKind = "READ" | "WRITE" | "ACTION" | "GECKOLIB";
const KIND_STYLE: Record<ToolKind, string> = {
  READ: "border-primary/40 bg-primary/10 text-primary",
  WRITE: "border-warning/40 bg-warning/10 text-warning",
  ACTION: "border-success/40 bg-success/10 text-success",
  GECKOLIB: "border-foreground/30 bg-foreground/5 text-foreground/90",
};

const TOOL_GROUPS: { title: string; tools: { name: string; kind: ToolKind }[] }[] = [
  {
    title: "Workspace",
    tools: [
      { name: "getWorkspaceInfo", kind: "READ" },
      { name: "listModElements", kind: "READ" },
      { name: "createElement", kind: "WRITE" },
      { name: "deleteElement", kind: "WRITE" },
      { name: "setModElementLock", kind: "WRITE" },
    ],
  },
  {
    title: "Actions",
    tools: [
      { name: "regenerateCode", kind: "ACTION" },
      { name: "buildWorkspace", kind: "ACTION" },
      { name: "runClient", kind: "ACTION" },
      { name: "runServer", kind: "ACTION" },
    ],
  },
  {
    title: "GeckoLib",
    tools: [
      { name: "getGeckoLibStatus", kind: "GECKOLIB" },
      { name: "listGeckoLibAssets", kind: "GECKOLIB" },
      { name: "importGeckoLibAssets", kind: "GECKOLIB" },
      { name: "createGeckoLibElement", kind: "GECKOLIB" },
      { name: "validateGeckoLibElement", kind: "GECKOLIB" },
    ],
  },
];

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-[0.35]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 md:pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            MCP · Local · Open-source · 1.0.0-2024.4 preview
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl leading-[1.05] text-foreground md:text-7xl">
            AI agents that actually
            <span className="italic text-primary"> understand </span>
            your MCreator workspace.
          </h1>
          <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-muted-foreground">
            A <span className="text-foreground">local-first MCreator plugin and MCP server</span>{" "}
            that gives Claude, Cursor, Codex, and other MCP clients a typed tool surface for
            MCreator workspaces.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground/90">
            No cloud upload. No telemetry. Your workspace stays on your machine.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/docs/quickstart"
              className="inline-flex items-center gap-2 rounded border border-primary/50 bg-primary/15 px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary transition hover:bg-primary/25"
            >
              Read the quickstart <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/docs/tools"
              className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              View tools
            </Link>
            <a
              href={`${import.meta.env.BASE_URL}downloads/MCreator-Agent-1.0.0-2024.4.zip`}
              download
              className="inline-flex items-center gap-2 rounded border border-success/50 bg-success/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-success transition hover:bg-success/20"
            >
              Download Preview
            </a>
            <a
              href="https://github.com/Nxkoo/MCreator-Agent"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
          </div>

          {/* Proof badges */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { Icon: Lock, label: "LOCAL MCP SERVER", body: "Runs on your machine" },
              {
                Icon: Boxes,
                label: "MCREATOR WORKSPACE TOOLS",
                body: "Elements, builds, assets",
              },
              {
                Icon: Layers,
                label: "GECKOLIB-AWARE",
                body: "Diagnostics, asset import, validation",
              },
            ].map((b) => (
              <div key={b.label} className="rounded-md border border-border bg-surface/60 p-4">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-primary">
                  <b.Icon className="h-3.5 w-3.5" />
                  {b.label}
                </div>
                <div className="mt-1.5 text-sm text-foreground/90">{b.body}</div>
              </div>
            ))}
          </div>

          {/* Hero terminal */}
          <div className="mt-10">
            <TerminalPanel />
          </div>

          <p className="mt-4 font-mono text-[11px] text-muted-foreground">
            Preview ZIP available now · Artifact source:{" "}
            <span className="text-foreground">build/libs/MCreator Agent.zip</span> · Initial
            validated support starts with <span className="text-foreground">MCreator 2024.4</span>.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionLabel>01 · How it works</SectionLabel>
          <h2 className="max-w-2xl text-3xl text-foreground md:text-4xl">
            From workspace to agent in five steps.
          </h2>
          <ol className="mt-8 grid gap-3 md:grid-cols-5">
            {[
              "Open MCreator",
              "Open your workspace",
              "Start MCreator Agent",
              "Connect your MCP client",
              "Let the agent call scoped tools",
            ].map((step, i) => (
              <li key={step} className="rounded-md border border-primary/20 bg-surface/40 p-4">
                <div className="font-mono text-[11px] uppercase tracking-wider text-primary">
                  Step {i + 1}
                </div>
                <div className="mt-2 text-sm text-foreground">{step}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* TRY A TOOL CALL */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel>02 · Try a tool call</SectionLabel>
              <h2 className="max-w-2xl text-4xl text-foreground md:text-5xl">
                Pick a tool. See what an agent gets back.
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              Each MCP tool is typed and scoped to the workspace. Below is an illustrative request
              and the response the agent receives — not a live call.
            </p>
          </div>
          <div className="mt-10">
            <TryTool />
          </div>
        </div>
      </section>

      {/* SEE IT */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionLabel>03 · Workspace-aware</SectionLabel>
              <h2 className="max-w-2xl text-4xl text-foreground md:text-5xl">
                Your agent sees the workspace, not just files.
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              MCreator Agent translates the workspace into structured MCP resources so an agent can
              reason about elements, procedures, and assets — and propose edits you can review.
            </p>
          </div>
          <div className="mt-10">
            <WorkspacePanel />
          </div>
          <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">
            Illustrative UI mockup. Not a screenshot of MCreator.
          </p>
        </div>
      </section>

      {/* FEATURES STRIP */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionLabel>04 · What it is</SectionLabel>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            {[
              {
                Icon: Network,
                title: "MCP for MCreator",
                body: "A standards-based MCP server exposing your workspace as resources and tools, ready for any MCP client.",
              },
              {
                Icon: Lock,
                title: "Local-first",
                body: "Runs entirely on your machine. Workspace data never leaves your computer unless you point the agent at a remote model.",
              },
              {
                Icon: PlayCircle,
                title: "Agent-ready",
                body: "Designed for assistants that plan, inspect, and edit — not just chat. Every action is a typed tool call.",
              },
              {
                Icon: Github,
                title: "Open-source",
                body: "MIT licensed. Inspect the source, run audits, extend the tool surface, contribute back.",
              },
              {
                Icon: Boxes,
                title: "Focused on modding",
                body: "Built around the way mod authors actually work — elements, procedures, textures, models, and animations.",
              },
              {
                Icon: ShieldCheck,
                title: "Version-aware",
                body: "Initial validated support starts with MCreator 2024.4. Version-aware support is designed to expand across newer releases.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-background p-6">
                <f.Icon className="h-4 w-4 text-primary" />
                <h3 className="mt-3 text-xl text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionLabel>05 · MCP tools</SectionLabel>
          <h2 className="max-w-3xl text-4xl text-foreground md:text-5xl">
            A small, deliberate tool surface.
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Each tool is typed, scoped to the workspace, and safe to call. Tools are grouped by
            intent so agents stay predictable.
          </p>

          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
            {TOOL_GROUPS.map((g) => (
              <div key={g.title} className="bg-background p-6">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {g.title}
                </div>
                <ul className="mt-4 space-y-2">
                  {g.tools.map((t) => (
                    <li key={t.name} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-mono text-[12.5px] text-foreground/90">
                        <Terminal className="h-3 w-3 text-primary/70" />
                        {t.name}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${KIND_STYLE[t.kind]}`}
                      >
                        {t.kind}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Link
              to="/docs/tools"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary hover:underline"
            >
              Full tool reference <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* GECKOLIB */}
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center">
          <div>
            <SectionLabel>06 · GeckoLib workflow</SectionLabel>
            <h2 className="text-4xl text-foreground md:text-5xl">
              Careful, scoped GeckoLib support.
            </h2>
            <p className="mt-4 text-muted-foreground">
              MCreator Agent supports GeckoLib workflows where it can be helpful and verifiable —
              and stops short of automating things that need a human in the loop.
            </p>
            <ol className="mt-6 space-y-2 text-sm">
              {[
                "Check plugin/API status",
                "List GeckoLib assets",
                "Import model, animation, or texture files",
                "Scaffold supported animated elements",
                "Validate known model/texture references",
                "Build the workspace",
              ].map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-foreground/90">
                  <span className="grid h-6 w-6 place-items-center rounded border border-primary/30 font-mono text-[11px] text-primary">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
            <p className="mt-6 font-mono text-[11px] text-muted-foreground">
              GeckoLib support is active when the GeckoLib Plugin is installed and enabled in the
              workspace. Full end-to-end animation authoring is not implied.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              getGeckoLibStatus →
            </div>
            <div className="mt-3 space-y-2 font-mono text-[12.5px]">
              <div className="text-success">✓ plugin detected · GeckoLib Plugin 6.0.2</div>
              <div className="text-success">✓ API available · geckolib</div>
              <div className="text-success">✓ supported type · animatedentity</div>
              <div className="text-warning">▲ missing model reference: warden.geo.json</div>
              <div className="text-muted-foreground">
                → open MCreator to review the element before building
              </div>
            </div>
            <div className="mt-4 border-t border-border/60 pt-3 font-mono text-[11px] text-muted-foreground">
              Suggestions are proposed, not applied. The agent waits for approval.
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionLabel>07 · Local-first architecture</SectionLabel>
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-4xl text-foreground md:text-5xl">
                Everything runs where your code lives.
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                The agent server is a single process you launch alongside your workspace. It speaks
                MCP on a local port, never opens an outbound connection on its own, and stores
                nothing in the cloud.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {[
                  [ShieldCheck, "No telemetry. No background uploads."],
                  [Cpu, "Single local process. Stop it any time."],
                  [
                    FileCode2,
                    "Workspace resources are scoped; asset imports use explicit source paths.",
                  ],
                  [Wrench, "Bring your own model: connect any MCP-compatible client."],
                ].map(([Icon, t], i) => (
                  <li key={i} className="flex items-center gap-2.5 text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary" /> <span>{t as string}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-surface p-6">
              <pre className="overflow-x-auto font-mono text-[12.5px] leading-relaxed text-foreground/90">
                {`+-----------------------------+
|  MCP client  (agent / IDE)  |
+--------------+--------------+
               |  MCP over localhost
               v
+-----------------------------+
|  mcreator-agent  (local)    |
|  * tools  * resources       |
|  * diagnostics * validators |
+--------------+--------------+
               |  reads / proposes edits
               v
+-----------------------------+
|  Your MCreator workspace    |
|  ./my-mod/                  |
+-----------------------------+`}
              </pre>
              <div className="mt-3 font-mono text-[11px] text-muted-foreground">
                Illustrative diagram. See{" "}
                <Link to="/docs/architecture" className="text-primary hover:underline">
                  architecture
                </Link>{" "}
                for details.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPATIBILITY */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionLabel>08 · Compatibility</SectionLabel>
          <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:items-end">
            <h2 className="text-4xl text-foreground md:text-5xl">Version-aware by design.</h2>
            <p className="text-muted-foreground">
              Initial validated support starts with{" "}
              <span className="text-foreground">MCreator 2024.4</span>, with version-aware support
              designed to expand across newer releases as they're validated. We don't claim support
              for versions we haven't tested.
            </p>
          </div>

          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                v: "2024.4",
                status: "Validated",
                tone: "success",
                note: "Initial reference target.",
              },
              {
                v: "Newer",
                status: "Planned / validating",
                tone: "primary",
                note: "Version-aware support designed to expand here.",
              },
              {
                v: "Older",
                status: "Unverified",
                tone: "muted",
                note: "Unverified. Not validated yet.",
              },
              {
                v: "GeckoLib Plugin",
                status: "Supported when installed",
                tone: "primary",
                note: "Activates GeckoLib-aware tools.",
              },
            ].map((r) => (
              <div key={r.v} className="bg-background p-6">
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Target
                </div>
                <div className="mt-1 font-display text-2xl text-foreground">{r.v}</div>
                <span
                  className={`mt-3 inline-flex rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                    r.tone === "success"
                      ? "border-success/40 bg-success/10 text-success"
                      : r.tone === "primary"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {r.status}
                </span>
                <p className="mt-3 text-sm text-muted-foreground">{r.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MCREATOR SKILL */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionLabel>09 · Companion skill</SectionLabel>
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <h2 className="text-4xl text-foreground md:text-5xl">
                A companion skill for agents.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Pair MCreator Agent with MCreator Skill to give your coding agent stronger
                MCreator-specific context, safer workflow rules, and better GeckoLib guidance.
              </p>
              <p className="mt-4 font-mono text-[11px] text-muted-foreground">
                MCreator Skill guides behavior. MCreator Agent provides local MCP tools.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/skill"
                  className="inline-flex items-center gap-2 rounded border border-primary/50 bg-primary/15 px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary transition hover:bg-primary/25"
                >
                  View MCreator Skill <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <a
                  href="https://github.com/Nxkoo/mcreator-skill"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  <Github className="h-3.5 w-3.5" /> GitHub
                </a>
              </div>
            </div>

            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
              {[
                {
                  Icon: ShieldCheck,
                  title: "Skill-only",
                  body: "Use with any coding agent for MCreator-aware guidance.",
                },
                {
                  Icon: Network,
                  title: "Skill + MCP",
                  body: "Pair with MCreator Agent when you want local workspace tools.",
                },
                {
                  Icon: Layers,
                  title: "GeckoLib-aware",
                  body: "Guide agents through safer animated workflow decisions.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-background p-6">
                  <item.Icon className="h-4 w-4 text-primary" />
                  <h3 className="mt-3 text-xl text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-10 text-center">
            <h2 className="text-4xl text-foreground md:text-5xl">
              Bring an agent to your MCreator workspace.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Read the quickstart, connect your MCP client, and keep everything local.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/docs/quickstart"
                className="inline-flex items-center gap-2 rounded border border-primary/50 bg-primary/20 px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary hover:bg-primary/30"
              >
                Start quickstart <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/docs/tools"
                className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                View tools
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
