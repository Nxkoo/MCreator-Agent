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
      <h2 className="text-2xl text-foreground">Plugin does not appear in MCreator</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Confirm the ZIP was installed in the MCreator plugins folder.</li>
        <li>Confirm Java plugins are enabled in MCreator Preferences.</li>
        <li>Restart MCreator after installing the plugin.</li>
        <li>Check that your MCreator version is supported (validated: 2024.4).</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">MCreator Agent status is not running</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Open a workspace in MCreator.</li>
        <li>Use the MCreator Agent menu/status action to check the server state.</li>
        <li>Restart MCreator if the server did not start.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">MCP client cannot connect</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Confirm MCreator is open.</li>
        <li>Confirm a workspace is open.</li>
        <li>Confirm the agent status shows a local port.</li>
        <li>
          Check the port file:
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            <li>
              Windows: <code>%USERPROFILE%\.mcreator\mcp\port</code>
            </li>
            <li>
              macOS / Linux: <code>~/.mcreator/mcp/port</code>
            </li>
          </ul>
        </li>
        <li>Use the HTTP URL in your client config:</li>
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

      <h2 className="mt-10 text-2xl text-foreground">Wrong port</h2>
      <p>
        MCreator Agent prefers <code>5175</code>, but if it is busy, it chooses a free local port.
        Read the port file to find the active port, then update your client config.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">No workspace loaded</h2>
      <p>
        A tool call fails with <code>No workspace loaded</code>. Open a workspace in MCreator,
        confirm the MCreator Agent status, then retry the tool call.
      </p>
      <Callout variant="note">
        Initial validated support starts with MCreator 2024.4. Older workspaces may load but are not
        validated.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">GeckoLib tools report unavailable</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Confirm Nerdy's GeckoLib Plugin is installed in MCreator.</li>
        <li>Restart MCreator after installing the plugin.</li>
        <li>Confirm the GeckoLib API is enabled in the workspace if required.</li>
        <li>
          Run <code>getGeckoLibStatus</code> to see the current plugin state.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">GeckoLib validation reports missing assets</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Confirm the model, animation, or texture was imported into the workspace.</li>
        <li>
          Check <code>targetName</code> if you renamed the asset during import.
        </li>
        <li>Open the element in MCreator UI and review asset references.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">Build or regenerate errors</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          Run the equivalent action from MCreator UI to see the full Gradle output.
        </li>
        <li>
          Run <code>validateGeckoLibElement</code> for GeckoLib elements.
        </li>
        <li>Check generated code lock state if applicable.</li>
        <li>Include logs when opening an issue.</li>
      </ul>

      <Callout variant="warning">
        When opening an issue on GitHub, include:
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>MCreator version</li>
          <li>MCreator Agent version</li>
          <li>generator</li>
          <li>GeckoLib Plugin version, if relevant</li>
          <li>the tool call used</li>
          <li>relevant log lines</li>
        </ul>
      </Callout>
    </DocsLayout>
  );
}
