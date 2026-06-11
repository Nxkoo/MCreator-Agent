import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { CodeBlock } from "@/components/site/CodeBlock";
import { Callout } from "@/components/site/Callout";

export const Route = createFileRoute("/docs/quickstart")({
  head: () => ({
    meta: [
      { title: "Quickstart — MCreator Agent" },
      {
        name: "description",
        content:
          "Install MCreator Agent, start the local MCP server, connect a client, and make the first tool call.",
      },
      { property: "og:title", content: "Quickstart — MCreator Agent" },
      {
        property: "og:description",
        content:
          "Install MCreator Agent, start the local MCP server, connect a client, and make the first tool call.",
      },
      { property: "og:url", content: "/docs/quickstart" },
    ],
    links: [{ rel: "canonical", href: "/docs/quickstart" }],
  }),
  component: Quickstart,
});

function Quickstart() {
  return (
    <DocsLayout eyebrow="Get started" title="Quickstart">
      <p>
        Install MCreator Agent, start the local MCP server against your workspace, and connect an
        MCP-compatible client. Plan for a few minutes.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">What you'll do</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Open your workspace in MCreator.</li>
        <li>Start the local MCreator Agent server.</li>
        <li>Point an MCP client at the local endpoint.</li>
        <li>Run your first tool call against the workspace.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">Before you start</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>MCreator installed (validated against 2024.4).</li>
        <li>MCreator Agent plugin installed.</li>
        <li>A workspace open in MCreator.</li>
        <li>An MCP-compatible client (Claude Desktop, Cursor, Codex, or similar).</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">Steps</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Open MCreator.</li>
        <li>Open the workspace you want the agent to see.</li>
        <li>
          Confirm MCreator Agent is running from the plugin menu/status action — it exposes a local
          MCP endpoint.
        </li>
        <li>Connect your MCP client using the config below.</li>
        <li>
          Call <code>getWorkspaceInfo</code> from the client.
        </li>
      </ol>

      <h2 className="mt-10 text-2xl text-foreground">Copy this config</h2>
      <CodeBlock
        filename="mcp.json"
        language="json"
        code={`{
  "mcpServers": {
    "mcreator-agent": {
      "url": "http://localhost:5175/mcp"
    }
  }
}`}
      />
      <Callout variant="note">
        The preferred local port is shown above. If it is busy, the plugin chooses a free port and
        writes it to <code>%USERPROFILE%\\.mcreator\\mcp\\port</code> (Windows) or <code>~/.mcreator/mcp/port</code> (macOS / Linux).
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">Expected result</h2>
      <p>
        The client receives workspace metadata, including the detected MCreator version, element
        count, and workspace folder. Use <code>getGeckoLibStatus</code> for GeckoLib-specific
        diagnostics.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">Common issue</h2>
      <p>
        <strong className="text-foreground">Client cannot connect.</strong> Confirm MCreator is open
        with a workspace loaded and that the MCreator Agent status reports the server as running.
        See{" "}
        <Link to="/docs/troubleshooting" className="text-primary hover:underline">
          Troubleshooting
        </Link>
        .
      </p>

      <h2 className="mt-10 text-2xl text-foreground">Next step</h2>
      <p>
        Explore the typed tool surface in{" "}
        <Link to="/docs/tools" className="text-primary hover:underline">
          Tools
        </Link>{" "}
        or wire up additional clients in{" "}
        <Link to="/docs/mcp-clients" className="text-primary hover:underline">
          MCP Clients
        </Link>
        .
      </p>

      <Callout variant="local">
        The agent only sees the workspace you opened in MCreator. Close the workspace or stop the
        server to revoke access.
      </Callout>
    </DocsLayout>
  );
}
