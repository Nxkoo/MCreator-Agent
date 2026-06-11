import { createFileRoute } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { Callout } from "@/components/site/Callout";
import { CodeBlock } from "@/components/site/CodeBlock";

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

      <h2 className="mt-10 text-2xl text-foreground">Requirements</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong className="text-foreground">Nerdy's GeckoLib Plugin</strong> installed in MCreator.
        </li>
        <li>
          <strong className="text-foreground">GeckoLib API</strong> enabled in your workspace settings.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">Workflow</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li><strong>Check status</strong>: Call <code>getGeckoLibStatus</code> to confirm the plugin is installed and active.</li>
        <li><strong>List assets</strong>: Use <code>listGeckoLibAssets</code> to enumerate models, animations, and textures.</li>
        <li><strong>Import assets</strong>: Import finished model, animation, or texture files with <code>importGeckoLibAssets</code>.</li>
        <li><strong>Create / scaffold element</strong>: Scaffold a new GeckoLib-aware element with <code>createGeckoLibElement</code>.</li>
        <li><strong>Validate references</strong>: Run <code>validateGeckoLibElement</code> to catch unsupported types and missing known model/texture references.</li>
        <li><strong>Build</strong>: Run <code>buildWorkspace</code> to confirm the workspace still compiles.</li>
      </ol>

      <h2 className="mt-10 text-2xl text-foreground">Examples</h2>
      
      <h3 className="mt-6 text-xl text-foreground">getGeckoLibStatus</h3>
      <p>Returns whether the GeckoLib plugin and API are ready.</p>
      <CodeBlock language="json" code={`{
  "method": "tools/call",
  "params": {
    "name": "getGeckoLibStatus",
    "arguments": {}
  }
}`} />

      <h3 className="mt-6 text-xl text-foreground">listGeckoLibAssets</h3>
      <p>Returns all known GeckoLib models, animations, and textures in the workspace.</p>
      <CodeBlock language="json" code={`{
  "method": "tools/call",
  "params": {
    "name": "listGeckoLibAssets",
    "arguments": {}
  }
}`} />

      <h3 className="mt-6 text-xl text-foreground">importGeckoLibAssets</h3>
      <p>Import finished blockbench exports.</p>
      <CodeBlock language="json" code={`{
  "method": "tools/call",
  "params": {
    "name": "importGeckoLibAssets",
    "arguments": {
      "assets": [
        { "sourcePath": "C:/downloads/my_model.geo.json", "targetName": "my_model", "kind": "geo_model" }
      ]
    }
  }
}`} />

      <h3 className="mt-6 text-xl text-foreground">createGeckoLibElement</h3>
      <p>Assist with scaffolding a supported GeckoLib animated element.</p>
      <CodeBlock language="json" code={`{
  "method": "tools/call",
  "params": {
    "name": "createGeckoLibElement",
    "arguments": {
      "elementType": "animatedentity",
      "elementName": "MyCustomMob",
      "definition": { "animModel": "my_model" }
    }
  }
}`} />

      <h3 className="mt-6 text-xl text-foreground">validateGeckoLibElement</h3>
      <p>Check if the element's configured model or texture references exist.</p>
      <CodeBlock language="json" code={`{
  "method": "tools/call",
  "params": {
    "name": "validateGeckoLibElement",
    "arguments": {
      "elementName": "MyCustomMob"
    }
  }
}`} />

      <h2 className="mt-10 text-2xl text-foreground">What still needs MCreator UI</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
        <li>Some plugin-specific fields may not be supported by scaffolding and require manual configuration in MCreator UI.</li>
        <li>Setting up complex AI tasks, specific procedure triggers, and fine-tuning hitbox properties.</li>
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
