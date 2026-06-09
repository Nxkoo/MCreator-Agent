import { createFileRoute } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { CodeBlock } from "@/components/site/CodeBlock";
import { Callout } from "@/components/site/Callout";

export const Route = createFileRoute("/docs/architecture")({
  head: () => ({
    meta: [
      { title: "Architecture — MCreator Agent" },
      {
        name: "description",
        content:
          "How MCreator Agent runs locally, speaks MCP, and exposes a scoped view of your workspace.",
      },
      { property: "og:title", content: "Architecture — MCreator Agent" },
      { property: "og:description", content: "Local-first architecture of MCreator Agent." },
      { property: "og:url", content: "/docs/architecture" },
    ],
    links: [{ rel: "canonical", href: "/docs/architecture" }],
  }),
  component: Arch,
});

function Arch() {
  return (
    <DocsLayout eyebrow="Reference" title="Architecture">
      <p>
        MCreator Agent runs as a local component inside MCreator. It speaks MCP on a local port and
        exposes a typed, scoped view of the active workspace. There is no cloud component.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">Local-only diagram</h2>
      <CodeBlock
        language="text"
        code={`┌──────────────────────────────────┐
│  Your machine                    │
│                                  │
│  ┌────────────────────────────┐  │
│  │  MCP client (agent / IDE)  │  │
│  └─────────────┬──────────────┘  │
│                │  http://localhost
│                ▼                 │
│  ┌────────────────────────────┐  │
│  │  MCreator                  │  │
│  │  └─ MCreator Agent plugin  │  │
│  │     • tools  • resources   │  │
│  │     • diagnostics          │  │
│  └─────────────┬──────────────┘  │
│                │  in-process     │
│                ▼                 │
│  ┌────────────────────────────┐  │
│  │  Active workspace          │  │
│  │  ./my-mod/                 │  │
│  └────────────────────────────┘  │
│                                  │
└──────────────────────────────────┘`}
      />

      <h2 className="mt-10 text-2xl text-foreground">What runs inside MCreator</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>The MCreator Agent plugin, loaded by MCreator at startup.</li>
        <li>A local MCP HTTP endpoint bound to the loopback host.</li>
        <li>Typed tool handlers that operate on the active workspace.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">What the MCP client sees</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>The list of available tools and their schemas.</li>
        <li>Workspace metadata and element summaries when it asks for them.</li>
        <li>Results of tool calls — successes, errors, and diagnostics.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">What is never uploaded</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Your workspace files. They stay on disk.</li>
        <li>Project metadata or element definitions.</li>
        <li>Any kind of telemetry from MCreator Agent.</li>
      </ul>
      <Callout variant="local">
        If you connect a remote model through your MCP client, the data your client sends to that
        model is governed by the client and that provider — not by MCreator Agent.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">Safety model</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Local-only binding. The server is intended for clients on the same machine.</li>
        <li>
          Workspace resources are scoped to the active workspace. Asset import tools only read
          source paths explicitly provided for import.
        </li>
        <li>Every action is a typed MCP tool — predictable and inspectable.</li>
        <li>No background network activity. The agent doesn't reach the network on its own.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">Roadmap shape</h2>
      <p>
        The tool surface is intentionally small. New tools are added when they're useful and
        verifiable, and version-aware support extends as additional MCreator releases are validated.
      </p>
    </DocsLayout>
  );
}
