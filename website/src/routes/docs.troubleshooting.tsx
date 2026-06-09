import { createFileRoute } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { CodeBlock } from "@/components/site/CodeBlock";
import { Callout } from "@/components/site/Callout";

export const Route = createFileRoute("/docs/troubleshooting")({
  head: () => ({
    meta: [
      { title: "Troubleshooting — MCreator Agent" },
      {
        name: "description",
        content:
          "Diagnose common MCreator Agent issues: plugin not loading, workspace not detected, MCP client cannot connect.",
      },
      { property: "og:title", content: "Troubleshooting — MCreator Agent" },
      { property: "og:description", content: "Common issues and fixes for MCreator Agent." },
      { property: "og:url", content: "/docs/troubleshooting" },
    ],
    links: [{ rel: "canonical", href: "/docs/troubleshooting" }],
  }),
  component: Trouble,
});

function Trouble() {
  return (
    <DocsLayout eyebrow="Reference" title="Troubleshooting">
      <h2 className="text-2xl text-foreground">Plugin doesn't load</h2>
      <p>Common issue: MCreator Agent actions don't appear after install.</p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Confirm MCreator's plugin list shows MCreator Agent as enabled.</li>
        <li>Restart MCreator after enabling the plugin.</li>
        <li>Confirm Java 21+ is in use.</li>
      </ul>
      <CodeBlock code={`java -version`} />

      <h2 className="mt-10 text-2xl text-foreground">Workspace not detected</h2>
      <p>
        Make sure a workspace is actually open in MCreator. The agent only exposes the active
        workspace.
      </p>
      <Callout variant="note">
        Initial validated support starts with MCreator 2024.4. Older workspaces may load but are not
        validated.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">MCP client cannot connect</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Confirm the MCreator Agent status reports the server as running.</li>
        <li>
          Match the port in your client config to the port written to{" "}
          <code>%USERPROFILE%\.mcreator\mcp\port</code>.
        </li>
        <li>Use the URL form in your client:</li>
      </ul>
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

      <h2 className="mt-10 text-2xl text-foreground">No workspace loaded</h2>
      <p>
        Common issue: a tool call fails with <code>No workspace loaded</code>. Open a workspace in
        MCreator, confirm the MCreator Agent status, then retry the tool call.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">GeckoLib tools report unavailable</h2>
      <p>
        GeckoLib tools activate only when the GeckoLib Plugin is installed and enabled in the
        workspace. Install GeckoLib through MCreator and reopen the workspace.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">Build / regenerate errors</h2>
      <p>
        If <code>buildWorkspace</code> or <code>regenerateCode</code> fail, run the equivalent
        action from MCreator's UI to see the full Gradle output, then re-run the tool.
      </p>

      <Callout variant="warning">
        When opening an issue on GitHub, include your MCreator version, the MCreator Agent version,
        and the relevant log lines. It speeds up triage significantly.
      </Callout>
    </DocsLayout>
  );
}
