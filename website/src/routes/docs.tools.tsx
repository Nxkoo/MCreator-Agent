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
        purpose:
          "Create a supported generic MCreator element by type and name. GeckoLib animated types should use createGeckoLibElement.",
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
      {
        name: "generateModElement",
        kind: "WRITE",
        purpose:
          "Generate code for one mod element via Generator#generateElement, optionally regenerate base registries, and protect gradle files.",
        args: `{ elementName: string, generateBase?: boolean, protectGradle?: boolean }`,
        example: `generateModElement({ elementName: "ZombieWarden", generateBase: true, protectGradle: true })`,
        notes:
          "Preferred over full regenerateCode for new GeckoLib entities. Restores mcreator.gradle/build.gradle when rewritten if protectGradle is true (default).",
      },
    ],
  },
  {
    title: "Actions",
    tools: [
      {
        name: "regenerateCode",
        kind: "ACTION",
        purpose:
          "Full-workspace code regeneration with file snapshot/diff. Prefer generateModElement for single elements.",
        args: `{ protectGradle?: boolean, awaitStartOnly?: boolean }`,
        notes:
          "Returns status=dispatched plus deleted/modified/restoredProtectedFiles. May still continue asynchronously in MCreator. Can delete untracked package Java.",
      },
      {
        name: "buildWorkspace",
        kind: "ACTION",
        purpose: "Dispatch workspace build with mutation snapshot/report for protected files.",
        args: `{ protectGradle?: boolean, awaitStartOnly?: boolean }`,
        notes:
          "Gradle completion may continue asynchronously; inspect the mutation report and local compile logs.",
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
        args: `{ assets: { sourcePath: string, targetName?: string, kind: "geo_model" | "geo" | "animation" | "texture", textureSubdir?: string }[], overwrite?: boolean }`,
        notes:
          "Dual-writes authoring (models/) and runtime (assets/<modid>/geo|animations). Texture subdir entities aliases entity.",
      },
      {
        name: "createGeckoLibElement",
        kind: "GECKOLIB",
        purpose:
          "Create a supported GeckoLib animated element. Optional generateCode runs single-element generation after confirmed create.",
        args: `{ elementType: string, elementName: string, definition?: object, generateCode?: boolean, strict?: boolean }`,
        notes:
          "Supports nested colors {value}, sounds/items {value}, and entity defaults (AI, deathTime, lerp, idle/walk). Create without generated Java is incomplete.",
      },
      {
        name: "updateGeckoLibElement",
        kind: "GECKOLIB",
        purpose:
          "Update a GeckoLib animated element definition through MCreator APIs (prefer over hand-editing .mod.json).",
        args: `{ elementName: string, definition: object, strict?: boolean, merge?: boolean }`,
        example: `updateGeckoLibElement({ elementName: "ZombieWarden", definition: { headMovement: true } })`,
      },
      {
        name: "validateGeckoLibElement",
        kind: "GECKOLIB",
        purpose:
          "Check GeckoLib plugin/API, type, geo/texture/animation assets, and metadata.files companions when present.",
        args: `{ elementName: string }`,
        notes:
          "Warns when generation has not run yet, and when headMovement requires multi-bone review.",
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
        <strong>Preview</strong>: Tool names and argument shapes may evolve before the first stable
        compatibility contract. The docs reflect the current preview build.
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
