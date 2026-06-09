import { createFileRoute } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { Callout } from "@/components/site/Callout";

export const Route = createFileRoute("/docs/geckolib")({
  head: () => ({
    meta: [
      { title: "GeckoLib — MCreator Agent" },
      {
        name: "description",
        content:
          "GeckoLib support in MCreator Agent: diagnostics, asset listing, import, scaffolding, and validation.",
      },
      { property: "og:title", content: "GeckoLib — MCreator Agent" },
      {
        property: "og:description",
        content:
          "GeckoLib support in MCreator Agent: diagnostics, asset listing, import, scaffolding, and validation.",
      },
      { property: "og:url", content: "/docs/geckolib" },
    ],
    links: [{ rel: "canonical", href: "/docs/geckolib" }],
  }),
  component: Gecko,
});

const WORKFLOW = [
  ["Check status", "Call getGeckoLibStatus to confirm the plugin is installed and active."],
  ["List assets", "Use listGeckoLibAssets to enumerate models, animations, and textures."],
  [
    "Import assets",
    "Import finished model, animation, or texture files with importGeckoLibAssets.",
  ],
  [
    "Create / scaffold element",
    "Scaffold a new GeckoLib-aware element with createGeckoLibElement.",
  ],
  [
    "Validate references",
    "Run validateGeckoLibElement to catch unsupported types and missing known model/texture references.",
  ],
  ["Build", "Run buildWorkspace to confirm the workspace still compiles."],
] as const;

function Gecko() {
  return (
    <DocsLayout eyebrow="Usage" title="GeckoLib workflow">
      <p>
        GeckoLib support is active when the GeckoLib Plugin is installed and enabled in the
        workspace. MCreator Agent assists with diagnostics, asset listing / import, element creation
        assistance, and validation. It does not imply full end-to-end animation authoring.
      </p>

      <Callout variant="geckolib">
        Supported with Nerdy's GeckoLib Plugin 6.0.2 for MCreator 2024.4. The agent proposes; you
        approve.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">Workflow</h2>
      <ol className="mt-4 space-y-3">
        {WORKFLOW.map(([title, body], i) => (
          <li key={title} className="flex gap-4 rounded-md border border-border bg-surface p-4">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded border border-primary/40 font-mono text-[12px] text-primary">
              {i + 1}
            </span>
            <div>
              <div className="text-foreground">{title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{body}</div>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-10 text-2xl text-foreground">What's supported</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="text-foreground">Diagnostics.</strong> Read-only checks for plugin/API
          availability, supported animated element types, and known model/texture references.
        </li>
        <li>
          <strong className="text-foreground">Asset listing &amp; import.</strong> Enumerate
          GeckoLib assets and import new model / animation files under validated paths.
        </li>
        <li>
          <strong className="text-foreground">Creation assistance.</strong> Scaffold a new GeckoLib
          element when explicitly asked. Supported types are <code>animatedentity</code>,{" "}
          <code>animateditem</code>, <code>animatedblock</code>, and <code>animatedarmor</code>.
        </li>
        <li>
          <strong className="text-foreground">Validation.</strong> Re-check after edits to confirm
          nothing regressed.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">What's not in scope (yet)</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
        <li>End-to-end automatic animation authoring from a text prompt.</li>
        <li>Controller, transition, or keyframe validation.</li>
        <li>Editing model geometry beyond importing finished assets.</li>
        <li>Rigging or skeleton inference.</li>
      </ul>

      <Callout variant="warning">
        If the GeckoLib Plugin isn't installed, GeckoLib tools report as unavailable. They never
        modify files outside the workspace.
      </Callout>
    </DocsLayout>
  );
}
