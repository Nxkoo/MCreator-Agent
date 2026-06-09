import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { Callout } from "@/components/site/Callout";
import { CodeBlock } from "@/components/site/CodeBlock";

export const Route = createFileRoute("/docs/release-guide")({
  head: () => ({
    meta: [
      { title: "Release Guide — MCreator Agent" },
      {
        name: "description",
        content:
          "1.0.0-2024.4 release checklist, MCreator compatibility notes, and how to update the changelog.",
      },
      { property: "og:title", content: "Release Guide — MCreator Agent" },
      {
        property: "og:description",
        content: "1.0.0-2024.4 release checklist and MCreator compatibility notes.",
      },
      { property: "og:url", content: "/docs/release-guide" },
    ],
    links: [{ rel: "canonical", href: "/docs/release-guide" }],
  }),
  component: ReleaseGuide,
});

const CHANGELOG_TEMPLATE = `## 1.0.1-2024.4 — YYYY-MM-DD

### Compatibility
- MCreator: 2024.4 (validated)
- Java: 21+
- GeckoLib plugin: 6.0.2, when installed

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Notes
- ...
`;

const TAG_CMDS = `git tag -a v1.0.0-2024.4 -m "MCreator Agent 1.0.0-2024.4 preview"
git push origin v1.0.0-2024.4`;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-surface/60 p-4">
      <div className="flex items-baseline gap-3">
        <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
          step {n}
        </span>
        <h3 className="text-lg text-foreground">{title}</h3>
      </div>
      <div className="mt-3 space-y-3 text-sm text-foreground/90">{children}</div>
    </section>
  );
}

const CHECKLIST: { label: string; detail: string }[] = [
  {
    label: "Version bumped",
    detail: "Update package.json, plugin manifest, and the UI version badge.",
  },
  {
    label: "Compatibility validated",
    detail: "Confirm tools/list and a build pass against the target MCreator version.",
  },
  {
    label: "GeckoLib regression run",
    detail: "Status, list, import, create, validate all return without errors.",
  },
  {
    label: "Endpoint smoke test",
    detail: "curl /mcp tools/list against a fresh workspace returns the full tool catalog.",
  },
  {
    label: "Changelog entry written",
    detail: "Add a section in docs/changelog with Added / Changed / Fixed / Compatibility.",
  },
  {
    label: "Docs reviewed",
    detail: "Skim Quickstart, MCP Clients, and Troubleshooting for any stale steps.",
  },
  {
    label: "Tag and release",
    detail: "Create git tag, push, then publish a GitHub release with the changelog entry.",
  },
];

function ReleaseGuide() {
  return (
    <DocsLayout eyebrow="Reference" title="Release 1.0.0-2024.4 — Guide">
      <p>
        This page walks through cutting a release of MCreator Agent. It covers the version
        checklist, the MCreator compatibility notes we publish with each tag, and how to update the{" "}
        <Link to="/docs/changelog" className="text-primary hover:underline">
          Changelog
        </Link>
        .
      </p>

      <Callout variant="note">
        The current preview version is <strong className="text-foreground">1.0.0-2024.4</strong>.
        Tool schemas are not frozen yet — breaking changes are allowed in this line, and every
        release must document them.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">Release checklist</h2>
      <ul className="mt-3 space-y-2">
        {CHECKLIST.map((c, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-md border border-border bg-surface/60 p-3"
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border border-primary/40 font-mono text-[10px] text-primary">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="font-mono text-[12px] uppercase tracking-wider text-foreground">
                {c.label}
              </div>
              <div className="text-sm text-muted-foreground">{c.detail}</div>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-2xl text-foreground">MCreator compatibility notes</h2>
      <p>
        We only claim compatibility with versions we've actually validated end-to-end. Compatibility
        is recorded per-release in the Changelog and surfaces in the Sidebar version badge.
      </p>
      <div className="mt-4 overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/50 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">MCreator</th>
              <th className="px-3 py-2">Agent</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className="px-3 py-2 font-mono text-[12px]">2024.4</td>
              <td className="px-3 py-2 font-mono text-[12px]">1.0.0-2024.4</td>
              <td className="px-3 py-2">
                <span className="rounded border border-success/40 bg-success/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-success">
                  validated
                </span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">Reference baseline.</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-mono text-[12px]">2025.x</td>
              <td className="px-3 py-2 font-mono text-[12px]">Next validated line</td>
              <td className="px-3 py-2">
                <span className="rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-warning">
                  pending
                </span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                Validation planned before any compatibility claim.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Step n={1} title="Bump versions">
        <p>Update every place the version surfaces:</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>
            <code>src/main/resources/plugin.json</code>
          </li>
          <li>
            <code>build.gradle</code> if artifact naming changes
          </li>
          <li>
            <code>website/package.json</code> for website metadata
          </li>
          <li>Sidebar / header version badge strings</li>
        </ul>
      </Step>

      <Step n={2} title="Update the changelog">
        <p>
          Add a new section at the top of{" "}
          <Link to="/docs/changelog" className="text-primary hover:underline">
            /docs/changelog
          </Link>{" "}
          using this template. Keep entries factual and tagged.
        </p>
        <CodeBlock language="bash" filename="changelog-entry.md" code={CHANGELOG_TEMPLATE} />
        <p className="text-muted-foreground">
          Tag legend: <strong className="text-foreground">added</strong>,{" "}
          <strong className="text-foreground">changed</strong>,{" "}
          <strong className="text-foreground">fixed</strong>,{" "}
          <strong className="text-foreground">compatibility</strong>,{" "}
          <strong className="text-foreground">note</strong>.
        </p>
      </Step>

      <Step n={3} title="Tag and publish">
        <CodeBlock language="bash" code={TAG_CMDS} />
        <p className="text-muted-foreground">
          Publish a GitHub release using the new tag. Paste the changelog section into the release
          body and attach <code>build/libs/MCreator Agent.zip</code>.
        </p>
      </Step>

      <Callout variant="warning">
        If any compatibility row regresses, downgrade the row to <em>pending</em> and add a{" "}
        <code>compatibility</code> entry to the changelog explaining what changed.
      </Callout>

      <h2 className="mt-12 text-2xl text-foreground">After the release</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Bump the Sidebar version pill if it still reads the previous tag.</li>
        <li>
          Open issues for follow-ups discovered during validation, link them from the{" "}
          <Link to="/docs/troubleshooting" className="text-primary hover:underline">
            Troubleshooting
          </Link>{" "}
          page if they affect users.
        </li>
        <li>
          Mention contributors in the release body — see{" "}
          <Link to="/contributing" className="text-primary hover:underline">
            Contributing
          </Link>
          .
        </li>
      </ul>
    </DocsLayout>
  );
}
