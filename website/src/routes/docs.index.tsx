import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { Callout } from "@/components/site/Callout";

export const Route = createFileRoute("/docs/")({
  head: () => ({
    meta: [
      { title: "Documentation — MCreator Agent" },
      {
        name: "description",
        content:
          "Introduction to MCreator Agent, the local-first MCP server for MCreator workspaces.",
      },
      { property: "og:title", content: "Documentation — MCreator Agent" },
      {
        property: "og:description",
        content:
          "Introduction to MCreator Agent, the local-first MCP server for MCreator workspaces.",
      },
      { property: "og:url", content: "/docs" },
    ],
    links: [{ rel: "canonical", href: "/docs" }],
  }),
  component: DocsIndex,
});

function DocsIndex() {
  return (
    <DocsLayout eyebrow="Documentation" title="Introduction">
      <p>
        <strong className="text-foreground">MCreator Agent</strong> is a local-first MCP server that
        exposes your MCreator workspace to AI agents. It runs as a single process on your machine,
        speaks the Model Context Protocol over a local HTTP endpoint, and gives an agent a typed,
        scoped view of your mod — elements, procedures, assets, and GeckoLib resources.
      </p>

      <p>
        It does not upload your workspace anywhere. It does not call out to a model on its own. You
        bring an MCP-compatible client, point it at the local server, and the agent starts working
        with what's already on disk.
      </p>

      <Callout variant="local">
        Your workspace stays on your machine. No telemetry, no background uploads.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">What it is</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
        <li>An MCP server for MCreator workspaces.</li>
        <li>Local-first, agent-ready, open-source (MIT).</li>
        <li>Focused on modding workflows, not general-purpose code editing.</li>
        <li>Designed with version-aware support in mind, starting with MCreator 2024.4.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">What it isn't</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
        <li>It isn't a hosted service.</li>
        <li>It isn't a code generator that ships unreviewed changes.</li>
        <li>It isn't a replacement for MCreator — it works alongside your workspace.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">Where to next</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <Link to="/docs/quickstart" className="text-primary hover:underline">
            Quickstart
          </Link>{" "}
          — install and connect in a few minutes.
        </li>
        <li>
          <Link to="/docs/installation" className="text-primary hover:underline">
            Installation
          </Link>{" "}
          — detailed install paths per platform.
        </li>
        <li>
          <Link to="/docs/mcp-clients" className="text-primary hover:underline">
            MCP clients
          </Link>{" "}
          — connect from the editor / agent you already use.
        </li>
        <li>
          <Link to="/docs/tools" className="text-primary hover:underline">
            Tools
          </Link>{" "}
          — the full MCP tool reference.
        </li>
      </ul>
    </DocsLayout>
  );
}
