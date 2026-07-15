# GeckoLib Support

This document describes the GeckoLib MVP support in MCreator Agent for MCreator 2024.4.

## Scope

- Supported MCreator version: 2024.4 (`2024004`).
- Supported GeckoLib Plugin artifact researched: Nerdy's GeckoLib Plugin `6.0.2`.
- Plugin ID: `geckolib_plugin`.
- GeckoLib API ID: `geckolib`.
- Supported animated element type registry names:
  - `animatedentity`
  - `animateditem`
  - `animatedblock`
  - `animatedarmor`

The implementation does not compile against Nerdy's GeckoLib Plugin classes. MCreator Agent can load when the GeckoLib Plugin is not installed.

## Required Manual Setup

1. Install Nerdy's GeckoLib Plugin compatible with MCreator 2024.4.
2. Open the workspace in MCreator.
3. Enable GeckoLib manually in Workspace Settings > Required APIs.
4. Restart or reload MCreator if the plugin or element types were installed after startup.

MCreator Agent does not silently enable the GeckoLib API. If the API is disabled, GeckoLib creation returns:

```text
GeckoLib API is not enabled in this workspace. Enable it in Workspace Settings > Required APIs, then retry.
```

## Status

Use `getGeckoLibStatus` or read `workspace://geckolib/status`.

The status reports:

- whether the GeckoLib Plugin is loaded
- whether GeckoLib API is enabled in the workspace
- whether the current generator exposes the GeckoLib API
- `registeredElementTypes`: canonical animated types registered by the plugin
- `creatableElementTypes`: types that may be created now (workspace ready + registered; generator-supported when listed, otherwise falls back to registered)
- `availableElementTypes`: backward-compatible alias of `registeredElementTypes`
- `typesAvailable`: true when **all four** canonical types are registered (legacy full-plugin signal)
- `anyTypeCreatable`: true when at least one type is creatable
- `allTypesCreatable`: whether all four canonical types are creatable
- `elementTypeAliases`: optional accepted input aliases; aliases are not required plugin registrations
- diagnostic problems and debug details

When the plugin is missing, the tools remain registered but report clear errors instead of crashing.

The canonical plugin registry names are `animateditem`, `animatedentity`, `animatedblock`, and `animatedarmor`.
Aliases such as `geckoitem` may be accepted as tool input, but status detection does not require or count aliases as
registered plugin types.

## Asset Listing

Use `listGeckoLibAssets` or read `workspace://geckolib/assets`.

The scan is read-only and filesystem-based. It merges **authoring** and **runtime** locations:

- geo models: `<workspace>/models/*.geo.json` and `src/main/resources/assets/<modid>/geo/*.geo.json`
- animations: `<workspace>/models/animations/*.animation.json` and `src/main/resources/assets/<modid>/animations/*.animation.json`
- textures: directories returned by `WorkspaceFolderManager#getTexturesFolder(TextureType)` (deduplicated)

The response includes:

- `geoModels`
- `animations`
- `textures`
- `invalidJsonFiles`
- `orphanCandidates`
- `warnings`

Invalid `.geo.json` and `.animation.json` files are reported without aborting the scan.

## Asset Import

Use `importGeckoLibAssets`.

Example arguments:

```json
{
  "assets": [
    {
      "sourcePath": "C:/path/model.geo.json",
      "kind": "geo_model"
    },
    {
      "sourcePath": "C:/path/walk.animation.json",
      "kind": "animation"
    },
    {
      "sourcePath": "C:/path/entity.png",
      "kind": "texture",
      "textureSubdir": "entity"
    }
  ],
  "overwrite": false
}
```

Supported kinds:

- `geo_model`: requires `.geo.json`, dual-writes to `models/` (MCreator authoring) and `assets/<modid>/geo/` (runtime).
- `animation`: requires `.animation.json`, dual-writes to `models/animations/` and `assets/<modid>/animations/`.
- `texture`: requires `.png`, imports into a MCreator texture directory. If `textureSubdir` is omitted, `item` is used.

Texture `textureSubdir` values are MCreator texture type IDs such as `item`, `block`, `entity`, and `armor`.

The import is transactional:

- all source paths and extensions are validated first
- files are copied into a workspace-local staging directory
- staged JSON files are parsed before final move
- final files are moved only after all validations pass
- failed imports remove staging files and do not leave partial target files created by that failed import

## Element Creation

Use `createGeckoLibElement`, not the generic `createElement`.

Example:

```json
{
  "elementType": "animateditem",
  "elementName": "TestAnimatedItem",
  "definition": {},
  "strict": true
}
```

The tool validates:

- workspace is loaded
- GeckoLib Plugin is loaded
- GeckoLib animated element types are registered
- current generator exposes the GeckoLib API
- GeckoLib API is enabled in the workspace
- `elementType` is one of the supported animated registry names
- `elementName` is a valid Java identifier and is not already used

Creation creates the MCreator mod element and storage through generic MCreator APIs and reflection from the registered
`ModElementType` storage class. Definition application supports:

- primitives / strings / booleans / lists
- nested color maps `{ "value": <intARGB>, "falpha": <number> }` for `java.awt.Color` fields
- nested `{ "value": "..." }` for `Sound` and `MItemBlock` fields
- nested number/logic/procedure wrappers when field types match

Unknown nested shapes are **skipped with a warning** (or rejected in `strict: true` mode) instead of failing the whole create.

After creation, the tool force-saves through MCreator's workspace persistence API and reports independent
postconditions:

- `recognizedInMemory`
- `definitionStored`
- `definitionLoadable`
- `workspaceEntryStored`
- `confirmed`
- `appliedFields` / `skippedFields` (when available)
- `generatedFiles` (when `generateCode` was requested and generation ran)

Each postcondition is `pass`, `fail`, or `unknown`. `confirmed` is true only when every postcondition passes. A
failed or unknown postcondition does not trigger automatic rollback because the workspace may already contain useful
partial state. Do not regenerate code while `confirmed` is false; inspect and reconcile the workspace first.

`generateCode` **defaults to true**: after a confirmed create, the tool runs single-element generation (and base
registry templates) when the generator supports it. Pass `generateCode: false` for scaffold-only. Prefer this path
over full-workspace `regenerateCode`.

The generic `createElement` tool rejects GeckoLib animated types with:

```text
This is a GeckoLib element type. Use createGeckoLibElement instead.
```

## Element Update

Use `updateGeckoLibElement` to change definition fields through MCreator APIs (do not hand-edit `.mod.json` while the
workspace is open):

```json
{
  "elementName": "TestAnimatedEntity",
  "definition": {
    "modelWidth": 2.0,
    "modelHeight": 5.8,
    "headMovement": true
  },
  "merge": true
}
```

## Blockbench item models (non-GeckoLib)

Use `importBlockbenchItemModel` for normal Java item models:

```json
{
  "sourceModelPath": "C:/path/item.json",
  "sourceTexturePath": "C:/path/item.png",
  "targetName": "my_item",
  "overwrite": true
}
```

This writes `models/custom/<name>.json`, `models/item/<name>.json`, and rewrites texture refs to
`assets/<modid>/textures/item/<name>.png` (`modid:item/<name>`). Custom item `use()` logic remains agent code.

## Single-element generation

Use `generateModElement`:

```json
{
  "elementName": "TestAnimatedEntity",
  "generateBase": true,
  "protectGradle": true
}
```

This calls MCreator `Generator#generateElement` for one element and optionally `generateBase` for registries.
Protected files such as `mcreator.gradle` are snapshotted and restored when mutation rewrites them.

Prefer this over full `regenerateCode`.

## Full regenerate / build

`regenerateCode` and `buildWorkspace` must report completion status. They are **not** safe to treat as
fire-and-forget. Full regenerate can delete untracked package files and rewrite gradle templates.

When available, responses include `status`, `deletedFiles`, `modifiedFiles`, `restoredProtectedFiles`, and `warnings`.

## Validation

Use `validateGeckoLibElement`.

Example:

```json
{
  "elementName": "TestAnimatedItem"
}
```

The validator is read-only. It checks:

- workspace is loaded
- element exists
- element type is one of the supported GeckoLib animated types
- GeckoLib Plugin and API status diagnostics
- known asset reference fields (geo/texture/animation) on disk
- generated Java companions when metadata/files already point at them
- `headMovement` caveat when enabled

## Recommended Flow

1. Install Nerdy's GeckoLib Plugin compatible with MCreator 2024.4.
2. Open the workspace.
3. Enable GeckoLib API manually in Workspace Settings > Required APIs.
4. Call `getGeckoLibStatus`.
5. Import assets using `importGeckoLibAssets`.
6. List assets using `listGeckoLibAssets`.
7. Create an element using `createGeckoLibElement` with a complete definition (or `generateCode: true`).
8. If create did not generate code, call `generateModElement`.
9. Validate using `validateGeckoLibElement`.
10. Build with completion-aware `buildWorkspace` or local `compileJava`.

Refreshing the workspace tab redraws the current in-memory model; it does not reload externally edited `.mcreator`
or `elements/*.mod.json` files from disk. A successful Gradle build also does not prove that the open MCreator UI or
MCP workspace model recognizes an element.

## Not Included

- No `workspace://geckolib/schema`.
- No automatic schema generation from third-party storage classes.
- No silent enabling of the GeckoLib API.
- No static dependency on GeckoLib Plugin classes.
- No bundled GeckoLib Plugin.
- No automatic reparenting of Blockbench head bones in geo JSON.

## Known Limitations

- The inspected plugin artifact was local zip `Nerdys_Geckolib_Plugin (6).zip`, SHA-256 `0B817423F444242F7AB4455E026B1178D274EC962EC32C2147B175D9AFB936C0`.
- The plugin is archived upstream; compatibility is best-effort for that artifact and MCreator 2024.4.
- Full regenerate remains risky for custom package classes not listed in any element `metadata.files`.
- Geo/animation import dual-writes authoring (`models/`) and runtime (`assets/<modid>/geo|animations`) paths.
- Texture `entities` is accepted as an alias of MCreator texture type `entity`.
