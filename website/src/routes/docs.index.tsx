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
        <strong className="text-foreground">MCreator Agent</strong> is a local-first MCP server for
        MCreator workspaces. It runs alongside MCreator, exposes a local HTTP endpoint, and gives
        MCP-compatible clients a typed, scoped view of the active workspace — elements, procedures,
        assets, build actions, and supported plugin workflows such as GeckoLib.
      </p>

      <p>
        It does not upload your workspace anywhere. It does not call a model on its own. You bring an
        MCP-compatible client, point it at the local server, and decide what the agent can ask or
        change.
      </p>

      <Callout variant="local">
        Your workspace stays on your machine. No telemetry, no background uploads.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">What it is</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-foreground/90">
        <li>An MCP server for MCreator workspaces.</li>
        <li>Local-first, agent-ready, open-source (MIT).</li>
        <li>Focused on modding workflows, not general-purpose code editing.</li>
        <li>
          Initial validated support starts with MCreator 2024.4, with version-aware support designed
          to expand across newer releases as they are validated.
        </li>
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
          — install the plugin, open MCreator, and connect your first client.
        </li>
        <li>
          <Link to="/docs/installation" className="text-primary hover:underline">
            Installation
          </Link>{" "}
          — learn how to install the plugin ZIP in MCreator.
        </li>
        <li>
          <Link to="/docs/mcp-clients" className="text-primary hover:underline">
            MCP Clients
          </Link>{" "}
          — configure Claude, Cursor, Codex, or another MCP client.
        </li>
        <li>
          <Link to="/docs/tools" className="text-primary hover:underline">
            Tools
          </Link>{" "}
          — see the available MCP tools.
        </li>
        <li>
          <Link to="/docs/geckolib" className="text-primary hover:underline">
            GeckoLib
          </Link>{" "}
          — understand the scoped GeckoLib workflow.
        </li>
      </ul>
    </DocsLayout>
  );
}
