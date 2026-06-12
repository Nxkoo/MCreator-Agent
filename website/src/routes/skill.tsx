import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Boxes,
  CheckCircle2,
  Code2,
  Github,
  Layers,
  Lock,
  Network,
  PackageCheck,
  ShieldCheck,
  Terminal,
  Workflow,
} from "lucide-react";
import { CommandBlock } from "@/components/site/CommandBlock";
import { SectionLabel } from "@/components/site/Panel";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const Route = createFileRoute("/skill")({
  head: () => ({
    meta: [
      { title: "MCreator Skill — Agent instructions for safer MCreator modding" },
      {
        name: "description",
        content:
          "A companion Agent Skill that teaches AI coding agents safer MCreator workflows, generated-code boundaries, GeckoLib awareness, and validation discipline.",
      },
      {
        property: "og:title",
        content: "MCreator Skill — Agent instructions for safer MCreator modding",
      },
      {
        property: "og:description",
        content:
          "Works standalone. Pairs with MCreator Agent for local MCP tools and active workspace access.",
      },
      { property: "og:url", content: "/skill" },
    ],
    links: [{ rel: "canonical", href: "/skill" }],
  }),
  component: SkillLanding,
});

const AGENTS = ["Codex", "Claude Code", "Cursor", "Gemini", "Windsurf", "Other coding agents"];

const TEACHES = [
  {
    Icon: Layers,
    title: "MCreator workspace structure",
    body: "Understand mod elements, resources, generated output, plugins, and manual code before editing.",
  },
  {
    Icon: Lock,
    title: "Generated-code boundaries",
    body: "Identify regeneration risk and keep project-owned code from being silently overwritten.",
  },
  {
    Icon: Boxes,
    title: "Mod element conventions",
    body: "Prefer MCreator-native configuration and keep technical packages focused.",
  },
  {
    Icon: ShieldCheck,
    title: "Safe editing workflow",
    body: "Inspect first, plan narrowly, classify files, and preserve unrelated project behavior.",
  },
  {
    Icon: Workflow,
    title: "GeckoLib workflow awareness",
    body: "Read real assets and metadata before making animation, model, or renderer decisions.",
  },
  {
    Icon: PackageCheck,
    title: "Validation and build discipline",
    body: "Require focused validation, regeneration review, builds, and an explicit task report.",
  },
];

const STANDALONE = [
  "You want better MCreator-aware code generation.",
  "You want safer planning before edits.",
  "You want agents to respect generated-code boundaries.",
  "You are working directly in the repository.",
];

const WITH_MCP = [
  "You want the agent to inspect the active workspace.",
  "You want typed MCP tools.",
  "You want workspace metadata, mod elements, resources, and actions.",
  "You want safer automation loops with validation.",
];

function SkillLanding() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-grid opacity-[0.38]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary">
              MCreator Skill
            </div>
            <h1 className="mt-5 max-w-4xl text-5xl leading-[1.04] text-foreground md:text-7xl">
              Agent instructions for safer{" "}
              <span className="italic text-primary">MCreator modding.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-muted-foreground">
              A companion skill that teaches AI coding agents how to work with MCreator projects,
              generated code boundaries, mod elements, GeckoLib workflows, and validation steps.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {[
                "Agent Skill",
                "MCreator Workflows",
                "GeckoLib Guidance",
                "Works Standalone",
                "Pairs with MCP",
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded border border-primary/30 bg-primary/5 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary"
                >
                  {badge}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://github.com/Nxkoo/mcreator-skill"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded border border-primary/50 bg-primary/15 px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary transition hover:bg-primary/25"
              >
                <Github className="h-3.5 w-3.5" /> View on GitHub
              </a>
              <a
                href="#install"
                className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                Install skill <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <Link
                to="/docs/quickstart"
                className="inline-flex items-center gap-2 rounded border border-success/40 bg-success/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-success transition hover:bg-success/20"
              >
                Pair with MCreator Agent
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-primary/25 bg-surface/80 p-6 shadow-[0_30px_80px_-50px_rgba(0,0,0,0.8)]">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Two companion layers
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-primary">
                  <Code2 className="h-3.5 w-3.5" /> MCreator Skill
                </div>
                <p className="mt-2 text-sm text-foreground/90">
                  Agent guidance, workflow rules, context, and safe behavior.
                </p>
              </div>
              <div className="flex items-center gap-3 px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                Optional pairing
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="rounded-md border border-success/30 bg-success/5 p-4">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-success">
                  <Network className="h-3.5 w-3.5" /> MCreator Agent
                </div>
                <p className="mt-2 text-sm text-foreground/90">
                  Local MCP server, workspace tools, resources, and actions.
                </p>
              </div>
            </div>
            <p className="mt-5 font-mono text-[11px] text-muted-foreground">
              Works standalone. Pairs with MCreator Agent.
            </p>
          </div>
        </div>
      </section>

      <section id="install" className="scroll-mt-20 border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <SectionLabel>01 · Install</SectionLabel>
            <h2 className="text-4xl text-foreground md:text-5xl">Give your agent the skill.</h2>
            <p className="mt-4 text-muted-foreground">
              Use your agent's supported skill installation flow. The repository follows the Agent
              Skills format and includes manual installation instructions.
            </p>
          </div>
          <div>
            <CommandBlock
              tabs={[
                {
                  id: "ecosystem",
                  label: "Skills ecosystem",
                  command: "npx skills add Nxkoo/mcreator-skill",
                  note: "Confirm this install method is supported by your agent and the skill repository before using it.",
                },
                {
                  id: "codex",
                  label: "Codex user skill",
                  command:
                    'git clone https://github.com/Nxkoo/mcreator-skill.git "$env:USERPROFILE\\.agents\\skills\\mcreator-ai"',
                  note: "Restart Codex if the skill does not appear immediately.",
                },
              ]}
            />
            <p className="mt-4 text-sm text-muted-foreground">
              Manual fallback: clone or download the skill repository and follow the instructions in
              its README.{" "}
              <a
                href="https://github.com/Nxkoo/mcreator-skill"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                View the repository
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionLabel>02 · Who it is for</SectionLabel>
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <h2 className="text-4xl text-foreground md:text-5xl">
                Reusable guidance for coding agents.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Use it with any coding agent that supports reusable instructions, skills, or
                project-level guidance.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {AGENTS.map((agent) => (
                <div key={agent} className="flex items-center gap-3 bg-background p-5">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{agent}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionLabel>03 · What it teaches agents</SectionLabel>
          <h2 className="max-w-3xl text-4xl text-foreground md:text-5xl">
            MCreator context before code generation.
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {TEACHES.map((item) => (
              <div key={item.title} className="bg-background p-6">
                <item.Icon className="h-4 w-4 text-primary" />
                <h3 className="mt-3 text-xl text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionLabel>04 · Standalone vs MCP</SectionLabel>
          <h2 className="max-w-3xl text-4xl text-foreground md:text-5xl">
            Guidance first. Tools when you need them.
          </h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <ComparisonCard
              Icon={Code2}
              eyebrow="MCreator Skill"
              title="Use standalone when"
              items={STANDALONE}
            />
            <ComparisonCard
              Icon={Network}
              eyebrow="MCreator Skill + MCreator Agent"
              title="Pair with MCP when"
              items={WITH_MCP}
              accent="success"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionLabel>05 · How the pieces connect</SectionLabel>
            <h2 className="text-4xl text-foreground md:text-5xl">
              One required layer. One optional layer.
            </h2>
            <p className="mt-4 text-muted-foreground">
              The skill changes how an agent reasons about MCreator work. MCreator Agent adds a
              local, typed tool surface when the workflow needs active workspace access.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="grid gap-3 text-center font-mono text-[11px] uppercase tracking-wider">
              <DiagramNode Icon={Bot}>AI coding agent</DiagramNode>
              <DiagramArrow label="uses" />
              <DiagramNode Icon={Code2}>MCreator Skill</DiagramNode>
              <DiagramArrow label="follows" />
              <DiagramNode Icon={ShieldCheck}>MCreator-safe workflow rules</DiagramNode>
              <div className="my-2 flex items-center gap-3 text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                Optional MCP path
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
                <DiagramNode Icon={Bot}>AI coding agent</DiagramNode>
                <DiagramArrow label="MCP" horizontal />
                <DiagramNode Icon={Network}>MCreator Agent</DiagramNode>
                <DiagramArrow label="accesses" horizontal />
                <DiagramNode Icon={Terminal}>Active workspace</DiagramNode>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-8 md:p-10">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-warning">
              <ShieldCheck className="h-4 w-4" /> Scope and safety
            </div>
            <p className="mt-4 max-w-4xl text-lg leading-relaxed text-foreground/90">
              The skill gives guidance. It does not directly access your workspace, run builds, or
              modify files by itself. Actual file edits depend on the agent/client you use. MCP tool
              access comes from MCreator Agent, not from the skill.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-10 text-center">
            <h2 className="text-4xl text-foreground md:text-5xl">
              Give your agent MCreator-specific context.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Install the skill, then pair it with MCreator Agent when you need local MCP tools.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="https://github.com/Nxkoo/mcreator-skill"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded border border-primary/50 bg-primary/20 px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary hover:bg-primary/30"
              >
                <Github className="h-3.5 w-3.5" /> View skill repo
              </a>
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Read MCreator Agent docs <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ComparisonCard({
  Icon,
  eyebrow,
  title,
  items,
  accent = "primary",
}: {
  Icon: typeof Code2;
  eyebrow: string;
  title: string;
  items: string[];
  accent?: "primary" | "success";
}) {
  const tone =
    accent === "success"
      ? "border-success/30 bg-success/5 text-success"
      : "border-primary/30 bg-primary/5 text-primary";
  return (
    <div className={`rounded-lg border p-6 ${tone}`}>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
        <Icon className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h3 className="mt-4 text-3xl text-foreground">{title}</h3>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm text-foreground/90">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiagramNode({ Icon, children }: { Icon: typeof Bot; children: string }) {
  return (
    <div className="flex min-h-14 items-center justify-center gap-2 rounded border border-primary/25 bg-background px-3 py-3 text-foreground">
      <Icon className="h-3.5 w-3.5 text-primary" />
      {children}
    </div>
  );
}

function DiagramArrow({ label, horizontal = false }: { label: string; horizontal?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 text-[9px] text-muted-foreground ${
        horizontal ? "sm:flex-col" : ""
      }`}
    >
      <span className={horizontal ? "sm:hidden" : ""}>↓</span>
      <span className={horizontal ? "hidden sm:inline" : "hidden"}>→</span>
      {label}
    </div>
  );
}
