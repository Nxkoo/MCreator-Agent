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
        GeckoLib support is active when Nerdy's GeckoLib Plugin is installed and enabled in the
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
          <strong className="text-foreground">GeckoLib API</strong> enabled in the workspace when
          required.
        </li>
        <li>A supported animated element type.</li>
        <li>Finished model, animation, and texture assets when importing files.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">Supported types</h2>
      <ul className="list-disc space-y-1 pl-5 font-mono text-sm">
        <li>animatedentity</li>
        <li>animateditem</li>
        <li>animatedblock</li>
        <li>animatedarmor</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">Supported workflow</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>
          <strong>Check status</strong>: Call <code>getGeckoLibStatus</code> to confirm the plugin is
          installed and active.
        </li>
        <li>
          <strong>List assets</strong>: Use <code>listGeckoLibAssets</code> to enumerate models,
          animations, and textures.
        </li>
        <li>
          <strong>Import assets</strong>: Import finished model, animation, or texture files with{" "}
          <code>importGeckoLibAssets</code>.
        </li>
        <li>
          <strong>Create / scaffold element</strong>: Scaffold a new GeckoLib-aware element with{" "}
          <code>createGeckoLibElement</code>.
        </li>
        <li>
          <strong>Open in MCreator UI</strong>: If plugin-specific fields still need configuration,
          open the element in MCreator.
        </li>
        <li>
          <strong>Validate references</strong>: Run <code>validateGeckoLibElement</code> to catch
          unsupported types and missing known model/texture references.
        </li>
        <li>
          <strong>Build</strong>: Run <code>regenerateCode</code> or <code>buildWorkspace</code> to
          confirm the workspace still compiles.
        </li>
      </ol>

      <h2 className="mt-10 text-2xl text-foreground">Examples</h2>

      <h3 className="mt-6 text-xl text-foreground">getGeckoLibStatus</h3>
      <p>
        Returns plugin/API readiness plus canonical <code>registeredElementTypes</code> and{" "}
        <code>creatableElementTypes</code>. The backward-compatible <code>typesAvailable</code>{" "}
        field is true when all four canonical types are registered; use{" "}
        <code>anyTypeCreatable</code> / <code>allTypesCreatable</code> for create readiness.
      </p>
      <CodeBlock
        language="json"
        code={`{
  "method": "tools/call",
  "params": {
    "name": "getGeckoLibStatus",
    "arguments": {}
  }
}`}
      />

      <h3 className="mt-6 text-xl text-foreground">listGeckoLibAssets</h3>
      <p>Returns all known GeckoLib models, animations, and textures in the workspace.</p>
      <CodeBlock
        language="json"
        code={`{
  "method": "tools/call",
  "params": {
    "name": "listGeckoLibAssets",
    "arguments": {}
  }
}`}
      />

      <h3 className="mt-6 text-xl text-foreground">importGeckoLibAssets</h3>
      <p>
        Import local model, animation, or texture files into validated workspace paths.{" "}
        <code>targetName</code> can be used to rename the copied asset. <code>geo</code> is accepted
        as an alias for <code>geo_model</code>.
      </p>
      <CodeBlock
        language="json"
        code={`{
  "method": "tools/call",
  "params": {
    "name": "importGeckoLibAssets",
    "arguments": {
      "assets": [
        {
          "sourcePath": "D:/assets/zombie_warden.geo.json",
          "kind": "geo",
          "targetName": "zombie_warden.geo.json"
        },
        {
          "sourcePath": "D:/assets/zombie_warden.animation.json",
          "kind": "animation"
        },
        {
          "sourcePath": "D:/assets/zombie_warden.png",
          "kind": "texture",
          "textureSubdir": "entity"
        }
      ],
      "overwrite": false
    }
  }
}`}
      />

      <h3 className="mt-6 text-xl text-foreground">createGeckoLibElement</h3>
      <p>Assist with scaffolding a supported GeckoLib animated element.</p>
      <CodeBlock
        language="json"
        code={`{
  "method": "tools/call",
  "params": {
    "name": "createGeckoLibElement",
    "arguments": {
      "elementType": "animatedentity",
      "elementName": "ZombieWarden",
      "definition": {}
    }
  }
}`}
      />
      <Callout variant="note">
        <code>createGeckoLibElement</code> assists with scaffolding. Some fields may still need to be
        reviewed or completed in the MCreator UI. Its response reports in-memory recognition,
        definition persistence, workspace-entry persistence, and <code>confirmed</code>. Do not
        regenerate when <code>confirmed</code> is false.
      </Callout>

      <Callout variant="warning">
        Refreshing the workspace tab does not reload externally edited workspace metadata from disk.
        A successful Gradle build also does not prove that the open MCreator UI or MCP model
        recognizes the element.
      </Callout>

      <h3 className="mt-6 text-xl text-foreground">validateGeckoLibElement</h3>
      <p>Check if the element's configured model or texture references exist.</p>
      <CodeBlock
        language="json"
        code={`{
  "method": "tools/call",
  "params": {
    "name": "validateGeckoLibElement",
    "arguments": {
      "elementName": "ZombieWarden"
    }
  }
}`}
      />

      <h2 className="mt-10 text-2xl text-foreground">What still needs MCreator UI</h2>
      <p>
        Some plugin-specific fields may still need to be configured in MCreator, especially when they
        depend on UI-only plugin behavior or complex plugin storage.
      </p>
      <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
        <li>Advanced animation controllers.</li>
        <li>Custom state transitions.</li>
        <li>Complex model setup.</li>
        <li>Plugin-specific configuration not safely exposed by MCP.</li>
        <li>Anything that validation reports as incomplete.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">What's not in scope yet</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
        <li>End-to-end automatic animation authoring from a text prompt.</li>
        <li>Editing model geometry.</li>
        <li>Rigging or skeleton inference.</li>
        <li>Full controller / transition / keyframe authoring.</li>
        <li>
          Silent edits to plugin-specific fields the MCP cannot safely validate.
        </li>
      </ul>

      <Callout variant="warning">
        GeckoLib tools never write outside the workspace. Import tools only read the explicit source
        paths you provide.
      </Callout>
    </DocsLayout>
  );
}
