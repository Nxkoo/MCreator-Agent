import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { Callout } from "@/components/site/Callout";

export const Route = createFileRoute("/docs/changelog")({
  head: () => ({
    meta: [
      { title: "Changelog — MCreator Agent" },
      {
        name: "description",
        content:
          "Release notes for MCreator Agent 1.0.0-2024.4 preview and ongoing compatibility updates.",
      },
      { property: "og:title", content: "Changelog — MCreator Agent" },
      { property: "og:description", content: "Release notes for MCreator Agent." },
      { property: "og:url", content: "/docs/changelog" },
    ],
    links: [{ rel: "canonical", href: "/docs/changelog" }],
  }),
  component: Changelog,
});

type Tag = "added" | "changed" | "fixed" | "compatibility" | "note";

const TAG_STYLE: Record<Tag, string> = {
  added: "border-success/40 bg-success/10 text-success",
  changed: "border-primary/40 bg-primary/10 text-primary",
  fixed: "border-warning/40 bg-warning/10 text-warning",
  compatibility: "border-foreground/30 bg-foreground/5 text-foreground",
  note: "border-border bg-surface/60 text-muted-foreground",
};

type Entry = { tag: Tag; text: string };
type Release = {
  version: string;
  date: string;
  status: "preview" | "upcoming";
  summary: string;
  entries: Entry[];
};

const RELEASES: Release[] = [
  {
    version: "1.0.0-2024.4 · preview",
    date: "Unreleased",
    status: "preview",
    summary:
      "First preview of MCreator Agent. Local-first MCP server with a small, deliberate tool surface.",
    entries: [
      { tag: "added", text: "Local MCP HTTP endpoint on the loopback host." },
      {
        tag: "added",
        text: "Workspace tools: getWorkspaceInfo, listModElements, createElement, deleteElement.",
      },
      { tag: "added", text: "Action tools: regenerateCode, buildWorkspace, runClient, runServer." },
      {
        tag: "added",
        text: "GeckoLib tools: status, list, import, create, validate (when plugin installed).",
      },
      { tag: "compatibility", text: "Initial validated support for MCreator 2024.4 / 2024004." },
      { tag: "compatibility", text: "Java 21+ required." },
      {
        tag: "note",
        text: "Current preview ZIP is available from the website and can also be built from source as build/libs/MCreator Agent.zip. Signed installers are pending.",
      },
    ],
  },
  {
    version: "Upcoming",
    date: "Planned",
    status: "upcoming",
    summary: "Direction for the next releases. Subject to change.",
    entries: [
      { tag: "added", text: "Published GitHub release artifact and signed installers." },
      {
        tag: "compatibility",
        text: "Version-aware support extending to newer MCreator releases as they're validated.",
      },
      { tag: "changed", text: "Lock tool schemas behind a versioned contract once stable." },
      { tag: "added", text: "Expanded GeckoLib diagnostics and richer validation reports." },
    ],
  },
];

function Changelog() {
  return (
    <DocsLayout eyebrow="Reference" title="Changelog">
      <p>
        Release notes for MCreator Agent. Entries are grouped by version and tagged so it's easy to
        see what's new, what changed, and which MCreator versions are validated.
      </p>

      <Callout variant="note">
        Compatibility entries reflect what we've actually validated. We don't claim support for
        versions we haven't tested. See{" "}
        <Link to="/docs/architecture" className="text-primary hover:underline">
          Architecture
        </Link>{" "}
        for the local-first model.
      </Callout>

      <div className="mt-8 space-y-10">
        {RELEASES.map((r) => (
          <section key={r.version} aria-labelledby={`rel-${r.version}`}>
            <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-2">
              <h2 id={`rel-${r.version}`} className="text-2xl text-foreground">
                {r.version}
              </h2>
              <span
                className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  r.status === "preview"
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {r.date}
              </span>
            </header>
            <p className="mt-3 text-sm text-muted-foreground">{r.summary}</p>
            <ul className="mt-4 space-y-2">
              {r.entries.map((e, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-md border border-border bg-surface/60 p-3"
                >
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${TAG_STYLE[e.tag]}`}
                  >
                    {e.tag}
                  </span>
                  <span className="text-sm text-foreground/90">{e.text}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </DocsLayout>
  );
}
