import { createFileRoute } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { CodeBlock } from "@/components/site/CodeBlock";
import { Callout } from "@/components/site/Callout";

type Kind = "READ" | "WRITE" | "ACTION" | "GECKOLIB";

type Tool = {
  name: string;
  kind: Kind;
  purpose: string;
  args: string;
  example?: string;
  notes?: string;
};

const KIND_STYLE: Record<Kind, string> = {
  READ: "border-primary/40 bg-primary/10 text-primary",
  WRITE: "border-warning/40 bg-warning/10 text-warning",
  ACTION: "border-success/40 bg-success/10 text-success",
  GECKOLIB: "border-foreground/30 bg-foreground/5 text-foreground/90",
};

const GROUPS: { title: string; tools: Tool[] }[] = [
  {
    title: "Workspace",
    tools: [
      {
        name: "getWorkspaceInfo",
        kind: "READ",
        purpose: "Return workspace metadata and the detected MCreator version.",
        args: `{}`,
        example: `getWorkspaceInfo()`,
        notes: "Safe to call repeatedly. No side effects.",
      },
      {
        name: "listModElements",
        kind: "READ",
        purpose: "List workspace mod elements, optionally filtered by MCreator element type.",
        args: `{ elementType?: string }`,
        example: `listModElements({ elementType: "item" })`,
      },
      {
        name: "createElement",
        kind: "WRITE",
        purpose: "Create a new generic workspace element by type and name.",
        args: `{ elementType: string, elementName: string }`,
        notes:
          "Currently writes safe default .mod.json templates for item and tool. GeckoLib animated types use createGeckoLibElement.",
      },
      {
        name: "deleteElement",
        kind: "WRITE",
        purpose: "Delete an existing workspace element by element name.",
        args: `{ elementName: string }`,
        notes: "Always confirm intent in the client UI.",
      },
      {
        name: "setModElementLock",
        kind: "WRITE",
        purpose: "Set whether an element's generated code is locked.",
        args: `{ elementName: string, locked: boolean }`,
        example: `setModElementLock({ elementName: "ExampleBlock", locked: true })`,
        notes: "Updates the workspace and UI without regenerating code or starting a build.",
      },
    ],
  },
  {
    title: "Actions",
    tools: [
      {
        name: "regenerateCode",
        kind: "ACTION",
        purpose: "Trigger MCreator's code regeneration for the current workspace.",
        args: `{}`,
      },
      {
        name: "buildWorkspace",
        kind: "ACTION",
        purpose: "Build the workspace and report success or compilation errors.",
        args: `{}`,
      },
      {
        name: "runClient",
        kind: "ACTION",
        purpose: "Launch the Minecraft client for the current workspace.",
        args: `{}`,
      },
      {
        name: "runServer",
        kind: "ACTION",
        purpose: "Launch the Minecraft server for the current workspace.",
        args: `{}`,
      },
    ],
  },
  {
    title: "GeckoLib",
    tools: [
      {
        name: "getGeckoLibStatus",
        kind: "GECKOLIB",
        purpose: "Report whether the GeckoLib plugin/API is installed and active.",
        args: `{}`,
      },
      {
        name: "listGeckoLibAssets",
        kind: "GECKOLIB",
        purpose: "Enumerate GeckoLib models, animations, and textures in the workspace.",
        args: `{}`,
      },
      {
        name: "importGeckoLibAssets",
        kind: "GECKOLIB",
        purpose: "Import local model / animation files into the workspace under validated paths.",
        args: `{ assets: { sourcePath: string, kind: string, textureSubdir?: string }[], overwrite?: boolean }`,
        notes:
          "Supported kinds include geo_model, animation, and texture. Geo and animation JSON are parsed before commit.",
      },
      {
        name: "createGeckoLibElement",
        kind: "GECKOLIB",
        purpose: "Create a supported GeckoLib animated element.",
        args: `{ elementType: string, elementName: string, definition?: object }`,
        notes:
          "Supported types: animatedentity, animateditem, animatedblock, animatedarmor. Public fields from definition are applied conservatively.",
      },
      {
        name: "validateGeckoLibElement",
        kind: "GECKOLIB",
        purpose:
          "Check GeckoLib plugin/API availability, supported type, and known asset references.",
        args: `{ elementName: string }`,
        notes:
          "Validation checks known model and texture references such as animModel, model, texture, and entityTexture.",
      },
    ],
  },
];

export const Route = createFileRoute("/docs/tools")({
  head: () => ({
    meta: [
      { title: "Tools — MCreator Agent" },
      {
        name: "description",
        content:
          "Typed MCP tool reference for MCreator Agent — workspace, actions, and GeckoLib tools.",
      },
      { property: "og:title", content: "Tools — MCreator Agent" },
      { property: "og:description", content: "Typed MCP tool reference for MCreator Agent." },
      { property: "og:url", content: "/docs/tools" },
    ],
    links: [{ rel: "canonical", href: "/docs/tools" }],
  }),
  component: Tools,
});

function KindBadge({ k }: { k: Kind }) {
  return (
    <span
      className={`inline-flex rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${KIND_STYLE[k]}`}
    >
      {k}
    </span>
  );
}

function Tools() {
  return (
    <DocsLayout eyebrow="Reference" title="Tools">
      <p>
        MCreator Agent exposes a small, deliberate set of MCP tools, grouped by intent. Each tool is
        typed, scoped to the active workspace, and safe for an agent to call.
      </p>

      <Callout variant="note">
        Tool names and shapes may evolve during preview. Once stable, they'll be locked behind a
        versioned schema.
      </Callout>

      {GROUPS.map((g) => (
        <section key={g.title} className="mt-10">
          <h2 className="text-2xl text-foreground">{g.title}</h2>
          <ul className="mt-4 space-y-3">
            {g.tools.map((t) => (
              <li key={t.name} className="rounded-md border border-border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[13px] text-primary">{t.name}</span>
                  <KindBadge k={t.kind} />
                </div>
                <p className="mt-2 text-sm text-foreground/90">{t.purpose}</p>
                <div className="mt-2 font-mono text-[12px] text-muted-foreground">
                  args: <span className="text-foreground/80">{t.args}</span>
                </div>
                {t.example && (
                  <pre className="mt-3 overflow-x-auto rounded border border-border/60 bg-background px-3 py-2 font-mono text-[12px] text-foreground/90">
                    <code>{t.example}</code>
                  </pre>
                )}
                {t.notes && <p className="mt-2 text-xs text-muted-foreground">{t.notes}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <h2 className="mt-12 text-2xl text-foreground">Calling tools from a client</h2>
      <p>Most MCP clients call tools through their built-in UI. The wire shape is:</p>
      <CodeBlock
        language="json"
        code={`{
  "method": "tools/call",
  "params": {
    "name": "getWorkspaceInfo",
    "arguments": {}
  }
}`}
      />

      <h2 className="mt-12 text-2xl text-foreground">Resources</h2>
      <p>The server also exposes MCP resources for read-only workspace context:</p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <code>workspace://overview</code>
        </li>
        <li>
          <code>workspace://elements</code>
        </li>
        <li>
          <code>workspace://structure</code>
        </li>
        <li>
          <code>workspace://geckolib/status</code>
        </li>
        <li>
          <code>workspace://geckolib/assets</code>
        </li>
      </ul>

      <Callout variant="local">
        Tools operate against the workspace currently open in MCreator. Asset import can read only
        the explicit source paths passed by the user or client.
      </Callout>
    </DocsLayout>
  );
}
