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
        Connect an MCP-compatible client to your MCreator workspace in a few minutes. No extra
        runtimes required for normal plugin use.
      </p>

      <Callout variant="note">
        Need to install first?{" "}
        <Link to="/docs/installation" className="text-primary hover:underline">
          Go to Installation
        </Link>{" "}
        to download the plugin ZIP and add it to MCreator.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">Before you start</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>MCreator installed (validated against 2024.4).</li>
        <li>MCreator Agent plugin installed.</li>
        <li>A workspace open in MCreator.</li>
        <li>
          An MCP-compatible client such as Claude Desktop, Cursor, Codex, or another HTTP-capable
          MCP client.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">What you'll do</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Open your workspace in MCreator.</li>
        <li>Confirm MCreator Agent is running.</li>
        <li>Point an MCP client at the local endpoint.</li>
        <li>Run your first tool call against the workspace.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">Steps</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Open MCreator.</li>
        <li>Open the workspace you want the agent to access.</li>
        <li>
          Confirm MCreator Agent is running from the MCreator Agent menu/status action — it exposes a
          local MCP endpoint.
        </li>
        <li>Copy the HTTP MCP endpoint config below into your MCP client.</li>
        <li>
          Call <code>getWorkspaceInfo</code> to confirm the client can read the workspace.
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
        <strong>Port discovery</strong>: MCreator Agent prefers <code>5175</code>. If that port is
        busy, it chooses a free local port and writes it to:
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>
            Windows: <code>%USERPROFILE%\.mcreator\mcp\port</code>
          </li>
          <li>
            macOS / Linux: <code>~/.mcreator/mcp/port</code>
          </li>
        </ul>
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">Expected result</h2>
      <p>
        Your MCP client should receive workspace metadata from <code>getWorkspaceInfo</code>,
        including the detected MCreator version, workspace folder, generator, and mod element count.
        Use <code>getGeckoLibStatus</code> for GeckoLib-specific diagnostics.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">Common issue</h2>
      <p>
        <strong className="text-foreground">Client cannot connect.</strong> Confirm MCreator is open
        with a workspace loaded and that the MCreator Agent status reports the server as running. See{" "}
        <Link to="/docs/troubleshooting" className="text-primary hover:underline">
          Troubleshooting
        </Link>
        .
      </p>

      <h2 className="mt-10 text-2xl text-foreground">Next step</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Use{" "}
          <Link to="/docs/tools" className="text-primary hover:underline">
            Tools
          </Link>{" "}
          to see what the agent can call.
        </li>
        <li>
          Use{" "}
          <Link to="/docs/mcp-clients" className="text-primary hover:underline">
            MCP Clients
          </Link>{" "}
          if your client needs a different setup.
        </li>
        <li>
          Use{" "}
          <Link to="/docs/geckolib" className="text-primary hover:underline">
            GeckoLib
          </Link>{" "}
          if your workspace uses Nerdy's GeckoLib Plugin.
        </li>
      </ul>

      <Callout variant="local">
        The agent only sees the workspace you opened in MCreator. Close the workspace or stop the
        server to revoke access.
      </Callout>
    </DocsLayout>
  );
}
