import { createFileRoute } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { CodeBlock } from "@/components/site/CodeBlock";
import { Callout } from "@/components/site/Callout";
import { CopyButton } from "@/components/site/CopyButton";

export const Route = createFileRoute("/docs/mcp-clients")({
  head: () => ({
    meta: [
      { title: "MCP Clients — MCreator Agent" },
      {
        name: "description",
        content:
          "Connect Claude Desktop, Cursor, Codex, and other MCP clients to MCreator Agent. Copyable configs and a verify-endpoint helper.",
      },
      { property: "og:title", content: "MCP Clients — MCreator Agent" },
      {
        property: "og:description",
        content: "Connect Claude Desktop, Cursor, Codex, and other MCP clients to MCreator Agent.",
      },
      { property: "og:url", content: "/docs/mcp-clients" },
    ],
    links: [{ rel: "canonical", href: "/docs/mcp-clients" }],
  }),
  component: Clients,
});

const GENERIC = `{
  "mcpServers": {
    "mcreator-agent": {
      "url": "http://localhost:5175/mcp"
    }
  }
}`;

const BRIDGE_WINDOWS = `{
  "mcpServers": {
    "mcreator-agent": {
      "command": "powershell.exe",
      "args": [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "D:\\\\path\\\\to\\\\MCreator-Agent\\\\scripts\\\\mcreator-mcp-bridge.ps1"
      ]
    }
  }
}`;

const CODEX = `{
  "mcpServers": {
    "mcreator-agent": {
      "transport": "http",
      "url": "http://localhost:5175/mcp"
    }
  }
}`;

const VERIFY_CURL = `curl -sS -X POST http://localhost:5175/mcp \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`;

const VERIFY_PS = `Invoke-RestMethod -Method Post -Uri http://localhost:5175/mcp \`
  -ContentType 'application/json' \`
  -Headers @{ Accept = 'application/json, text/event-stream' } \`
  -Body '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`;

function ConfigSnippet({
  id,
  title,
  code,
  note,
}: {
  id: string;
  title: string;
  code: string;
  note?: string;
}) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="text-2xl text-foreground">
          {title}
        </h2>
        <CopyButton value={code} label="Copy config" />
      </div>
      {note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}
      <CodeBlock filename="mcp.json" language="json" code={code} />
    </section>
  );
}

function Clients() {
  return (
    <DocsLayout eyebrow="Usage" title="MCP Clients">
      <p>
        MCreator Agent exposes a local MCP HTTP endpoint while a workspace is open. Any HTTP-capable
        MCP client can connect to it directly. Stdio-only clients can use the included PowerShell
        bridge.
      </p>

      <ConfigSnippet
        id="generic"
        title="Generic MCP HTTP endpoint"
        code={GENERIC}
        note="Drop this into any client that accepts a url-based MCP server entry."
      />

      <ConfigSnippet
        id="bridge-windows"
        title="Windows stdio bridge"
        code={BRIDGE_WINDOWS}
        note="Use this for clients that launch MCP servers over stdio. Replace the script path with your local checkout path."
      />

      <ConfigSnippet
        id="codex"
        title="Codex / HTTP clients"
        code={CODEX}
        note="Any HTTP-based MCP client works the same way. Adjust the host or port if your client requires it."
      />

      <h2 className="mt-12 text-2xl text-foreground">Port discovery</h2>
      <p>
        MCreator Agent prefers <code>5175</code>. If that port is in use, it picks a free local port
        and writes it to <code>%USERPROFILE%\.mcreator\mcp\port</code>. The PowerShell bridge reads
        this file automatically unless you pass <code>-Endpoint</code>, set{" "}
        <code>MCREATOR_MCP_URL</code>, or set <code>MCREATOR_MCP_PORT</code>.
      </p>

      {/* VERIFY ENDPOINT */}
      <section
        aria-labelledby="verify"
        className="mt-12 rounded-lg border border-primary/30 bg-primary/5 p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="verify" className="text-2xl text-foreground">
            Verify the endpoint
          </h2>
          <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
            Helper
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Confirm the local endpoint responds before debugging client config. A successful call
          returns a JSON-RPC response listing the available tools.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                macOS / Linux
              </span>
              <CopyButton value={VERIFY_CURL} label="Copy curl" />
            </div>
            <CodeBlock language="bash" code={VERIFY_CURL} />
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Windows · PowerShell
              </span>
              <CopyButton value={VERIFY_PS} label="Copy script" />
            </div>
            <CodeBlock language="powershell" code={VERIFY_PS} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded border border-success/30 bg-success/5 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-success">✓ OK</div>
            <p className="mt-1 text-xs text-muted-foreground">
              JSON response listing tools. Client config is correct — restart the client.
            </p>
          </div>
          <div className="rounded border border-warning/30 bg-warning/5 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-warning">
              ▲ Connection refused
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              MCreator isn't open with a workspace, or the port differs. Check the agent status.
            </p>
          </div>
          <div className="rounded border border-border bg-surface/60 p-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-foreground">
              406 Not Acceptable
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Missing <code>Accept: application/json, text/event-stream</code> header.
            </p>
          </div>
        </div>
      </section>

      <h2 className="mt-12 text-2xl text-foreground">Common connection errors</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <strong className="text-foreground">Connection refused.</strong> The workspace isn't open
          in MCreator.
        </li>
        <li>
          <strong className="text-foreground">Wrong port.</strong> Match the port shown by the
          MCreator Agent status action or written to the local port file.
        </li>
        <li>
          <strong className="text-foreground">Tool call says no workspace loaded.</strong> Open a
          workspace in MCreator, then retry the tool call.
        </li>
      </ul>

      <Callout variant="local">
        The server binds on the local loopback host. Workspace resources are scoped to the active
        workspace; asset import tools only read source paths you explicitly provide.
      </Callout>
    </DocsLayout>
  );
}
