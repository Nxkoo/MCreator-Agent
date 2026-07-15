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
          "GeckoLib support in MCreator Agent: diagnostics, asset import, create/update, single-element generate, and validation.",
      },
      { property: "og:title", content: "GeckoLib — MCreator Agent" },
      {
        property: "og:description",
        content:
          "GeckoLib support in MCreator Agent: diagnostics, asset import, create/update, single-element generate, and validation.",
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
        workspace. MCreator Agent assists with diagnostics, asset listing/import, element create and
        update, single-element code generation, and validation. It does not imply full end-to-end
        animation authoring.
      </p>

      <Callout variant="geckolib">
        Supported with Nerdy's GeckoLib Plugin 6.0.2 for MCreator 2024.4. Prefer{" "}
        <code>generateModElement</code> over full-workspace <code>regenerateCode</code>.
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

      <h2 className="mt-10 text-2xl text-foreground">Recommended workflow</h2>
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
          <code>importGeckoLibAssets</code> (dual-writes authoring + runtime paths).
        </li>
        <li>
          <strong>Create element</strong>: Use <code>createGeckoLibElement</code> with a complete{" "}
          <code>definition</code> (hitbox, model, texture, animations, optional{" "}
          <code>headMovement</code>). Optionally pass <code>generateCode: true</code>.
        </li>
        <li>
          <strong>Generate code</strong>: If create did not generate Java, call{" "}
          <code>generateModElement</code> (preferred over full <code>regenerateCode</code>).
        </li>
        <li>
          <strong>Update if needed</strong>: Use <code>updateGeckoLibElement</code> instead of
          hand-editing <code>.mod.json</code> while the workspace is open.
        </li>
        <li>
          <strong>Validate</strong>: Run <code>validateGeckoLibElement</code> for asset and codegen
          postconditions.
        </li>
        <li>
          <strong>Build</strong>: Use <code>buildWorkspace</code> (mutation report) or local{" "}
          <code>compileJava</code>.
        </li>
      </ol>

      <Callout variant="warning">
        <code>createGeckoLibElement</code> alone is a scaffold unless generation ran. Treat create
        without entity/model/renderer/init as incomplete. Full <code>regenerateCode</code> can delete
        untracked Java and rewrite <code>mcreator.gradle</code> — the tool now snapshots and can
        restore protected gradle files, but single-element generate is still safer.
      </Callout>

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
      <p>Returns known GeckoLib models, animations, and textures (authoring + runtime paths).</p>
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
        <code>geo</code> is accepted as an alias for <code>geo_model</code>. Texture subdir{" "}
        <code>entities</code> aliases <code>entity</code>.
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
          "kind": "geo_model"
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
      <p>
        Create a supported animated element. Definition supports primitives, colors as{" "}
        <code>{"{ value: intARGB }"}</code>, sounds/items as <code>{"{ value: string }"}</code>, and
        more. Unknown nested shapes are skipped with warnings unless <code>strict: true</code>.
      </p>
      <CodeBlock
        language="json"
        code={`{
  "method": "tools/call",
  "params": {
    "name": "createGeckoLibElement",
    "arguments": {
      "elementType": "animatedentity",
      "elementName": "ZombieWarden",
      "generateCode": true,
      "definition": {
        "mobName": "Zombie Warden",
        "mobModelTexture": "zombie_warden.png",
        "model": "zombie_warden.geo.json",
        "modelWidth": 0.8,
        "modelHeight": 2.0,
        "animation1": "idle",
        "animation2": "walk",
        "enable2": true,
        "headMovement": true,
        "hasSpawnEgg": true,
        "spawnEggBaseColor": { "value": -16711936 },
        "spawnEggDotColor": { "value": -1 }
      }
    }
  }
}`}
      />
      <Callout variant="note">
        Response reports <code>confirmed</code>, <code>appliedFields</code>,{" "}
        <code>skippedFields</code>, and optionally <code>generatedFiles</code>. Do not full-regen when{" "}
        <code>confirmed</code> is false.
      </Callout>

      <h3 className="mt-6 text-xl text-foreground">updateGeckoLibElement</h3>
      <p>
        Update definition fields through MCreator APIs. Prefer this over hand-editing{" "}
        <code>elements/*.mod.json</code> while the workspace is open.
      </p>
      <CodeBlock
        language="json"
        code={`{
  "method": "tools/call",
  "params": {
    "name": "updateGeckoLibElement",
    "arguments": {
      "elementName": "ZombieWarden",
      "definition": {
        "modelWidth": 2.0,
        "modelHeight": 5.8,
        "headMovement": true
      }
    }
  }
}`}
      />

      <h3 className="mt-6 text-xl text-foreground">generateModElement</h3>
      <p>
        Generate code for one element via MCreator <code>Generator#generateElement</code>, optionally
        run <code>generateBase</code> for registries, and protect gradle files if rewritten.
      </p>
      <CodeBlock
        language="json"
        code={`{
  "method": "tools/call",
  "params": {
    "name": "generateModElement",
    "arguments": {
      "elementName": "ZombieWarden",
      "generateBase": true,
      "protectGradle": true
    }
  }
}`}
      />

      <h3 className="mt-6 text-xl text-foreground">validateGeckoLibElement</h3>
      <p>
        Check assets on disk, optional <code>metadata.files</code> companions, and head-movement
        caveats.
      </p>
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

      <h2 className="mt-10 text-2xl text-foreground">Head movement</h2>
      <p>
        Setting <code>headMovement: true</code> is not always enough for custom Blockbench layouts.
        If <code>nose</code> / <code>headwear</code> are siblings of <code>head</code> (not children),
        generated look-at logic may need multi-bone rotation after lock.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">What still needs MCreator UI</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
        <li>Advanced animation controllers and state transitions.</li>
        <li>Complex model setup not safely exposed by MCP.</li>
        <li>Anything validation reports as incomplete.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">What's not in scope yet</h2>
      <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
        <li>End-to-end automatic animation authoring from a text prompt.</li>
        <li>Editing model geometry / rigging.</li>
        <li>Full controller / transition / keyframe authoring.</li>
        <li>Automatic reparenting of head bones in geo JSON.</li>
      </ul>

      <Callout variant="warning">
        GeckoLib tools never write outside the workspace. Import tools only read the explicit source
        paths you provide.
      </Callout>
    </DocsLayout>
  );
}
