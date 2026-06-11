# MCreator Agent

> AI agents that actually understand your MCreator workspace.

![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-preview-orange)
![Version](https://img.shields.io/badge/version-1.0.0--2024.4-informational)
![MCreator](https://img.shields.io/badge/MCreator-2024.4%20validated-brightgreen)

## Overview

MCreator Agent is a local-first MCP server for MCreator workspaces. It lets
MCP-compatible AI clients inspect workspace structure, understand mod elements,
trigger safe actions, and assist scoped workflows such as GeckoLib diagnostics
and asset validation.

The server runs inside MCreator as a Java plugin and exposes a local HTTP MCP
endpoint. Your workspace stays on your machine, and clients interact with it
through typed MCP tools instead of direct file-system guesswork.

## Why MCreator Agent?

MCreator workspaces contain structured mod elements, generated code, resources,
plugin-specific metadata, and UI-driven actions. Generic AI file access can miss
that context or suggest changes that do not match how MCreator expects projects
to be edited.

MCreator Agent gives an AI client a narrower and more useful interface:

- read workspace metadata and mod elements through MCreator APIs;
- trigger MCreator actions such as code regeneration, builds, and run targets;
- keep write operations scoped to explicit tools;
- expose GeckoLib-aware diagnostics without claiming full animation authoring;
- support local development workflows without requiring a cloud service.

## Features

- Local MCP server hosted by the MCreator plugin.
- HTTP endpoint at `/mcp`, with a legacy SSE endpoint at `/mcp/sse`.
- Health endpoint for quick local checks.
- Workspace inspection and mod element listing.
- Supported mod element creation and deletion.
- MCreator build, regenerate code, run client, and run server actions.
- GeckoLib Plugin/API status checks.
- GeckoLib model, animation, and texture asset listing/import helpers.
- GeckoLib element creation assistance and validation for supported cases.
- Port discovery through the local MCreator Agent status menu and port file.

## Current Status

MCreator Agent is in preview. The current implementation targets MCreator
2024.4 first and is designed to expand version-aware support as additional
MCreator releases are validated.

The plugin currently provides the MCP server, workspace tools, action tools,
GeckoLib-focused helpers, Gradle build tasks, and a PowerShell stdio bridge for
clients that do not connect directly to HTTP MCP endpoints.

Signed installer scripts are planned. MCreator's plugin ZIP is available for
preview builds.

## Compatibility

Initial validated support starts with MCreator 2024.4, with version-aware
support designed to expand across newer releases as they are validated.

| Target | Status |
|---|---|
| MCreator 2024.4 | Validated initial target |
| Newer MCreator versions | Planned / validating |
| Older MCreator versions | Unverified |
| GeckoLib Plugin | Supported when installed and enabled |

Current repository settings:

| Component | Value |
|---|---|
| Plugin version | `1.0.0-2024.4` |
| MCreator plugin supported version | `2024004` |
| Java | `21+` |
| Reference MCreator source tag | `2024.4.52410` |

## Installation

> Signed installers are planned. The preview ZIP is available in the website
> assets and can also be built from source.

### Manual install

Download the preview ZIP from the website or build the same artifact from
source, then install the generated plugin ZIP:

1. Download `website/public/downloads/MCreator-Agent-1.0.0-2024.4.zip`, or
   build `build\libs\MCreator Agent.zip` using the source build steps below.
2. Move the ZIP into your MCreator plugins folder, or install it from
   MCreator's plugin UI.
3. Enable Java plugins in MCreator if needed.
4. Restart MCreator.
5. Open a workspace.
6. Check the MCreator Agent status.

### From source

Clone this repository and make sure Java 21 is available.

Clone the validated MCreator source into the expected `MCreator` folder:

```powershell
git clone --depth 1 --branch 2024.4.52410 https://github.com/MCreator/MCreator.git MCreator
```

Build the plugin ZIP:

```powershell
.\gradlew.bat jar -Pmcreator_path=MCreator --no-daemon
```

The generated plugin ZIP is written to:

```text
build\libs\MCreator Agent.zip
```

Run MCreator with the plugin for local development:

```powershell
.\gradlew.bat runMCreatorWithPlugin -Pmcreator_path=MCreator --no-daemon
```

Compile against an external MCreator source checkout:

```powershell
.\gradlew.bat compileJava -Pmcreator_path=C:\path\to\MCreator-2024.4.52410 --no-daemon
```

## Connecting an MCP Client

MCreator Agent starts when MCreator loads a workspace. By default it tries
`http://localhost:5175/mcp`. If that port is busy, it picks a free port.

The active port is written to:

```text
%USERPROFILE%\.mcreator\mcp\port
```

If the port changes, check the plugin status menu or the local port file,
depending on the current build.

### Generic HTTP MCP endpoint

For MCP clients that support HTTP MCP servers:

```json
{
  "mcpServers": {
    "mcreator-agent": {
      "url": "http://localhost:5175/mcp"
    }
  }
}
```

Quick health check:

```powershell
$port = Get-Content "$env:USERPROFILE\.mcreator\mcp\port"
Invoke-RestMethod "http://localhost:$port/health"
```

### Claude Desktop

If your Claude Desktop build supports HTTP MCP server entries, use the generic
HTTP configuration above.

For stdio-only MCP client configurations, use the included bridge script. The
bridge reads JSON-RPC messages from stdin, discovers the running local MCreator
Agent port, and forwards requests to the HTTP endpoint.

```json
{
  "mcpServers": {
    "mcreator-agent": {
      "command": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
      "args": [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "C:\\path\\to\\MCreator Agent\\scripts\\mcreator-mcp-bridge.ps1"
      ]
    }
  }
}
```

Start MCreator, open a workspace, and confirm the MCreator Agent status before
starting or reloading the client.

### Cursor / other MCP clients

Use the generic HTTP endpoint when the client supports HTTP MCP servers:

```text
http://localhost:5175/mcp
```

For clients that only support stdio MCP servers, configure them to run
`scripts\mcreator-mcp-bridge.ps1` in the same way as the Claude Desktop bridge
example.

## Available Tools

### Workspace tools

| Tool | Type | Description |
|---|---|---|
| `getWorkspaceInfo` | Read | Returns workspace metadata, MCreator version, element count, and workspace path. |
| `listModElements` | Read | Lists mod elements in the current workspace. |
| `createElement` | Write | Creates a generic mod element by type/name; item and tool get safe default definitions. |
| `deleteElement` | Write | Deletes a mod element by name from the workspace. |
| `setModElementLock` | Write | Locks or unlocks a mod element's generated code without regenerating or building. |

### Action tools

| Tool | Type | Description |
|---|---|---|
| `regenerateCode` | Action | Triggers code regeneration. |
| `buildWorkspace` | Action | Starts a workspace build. |
| `runClient` | Action | Launches the Minecraft client through MCreator. |
| `runServer` | Action | Launches a local server through MCreator. |

### GeckoLib tools

| Tool | Type | Description |
|---|---|---|
| `getGeckoLibStatus` | Read | Detects GeckoLib Plugin/API availability and reports problems. |
| `listGeckoLibAssets` | Read | Lists GeckoLib models, animations, and textures. |
| `importGeckoLibAssets` | Write | Imports GeckoLib assets into validated workspace paths. |
| `createGeckoLibElement` | Write | Assists with creating/scaffolding GeckoLib elements when supported. |
| `validateGeckoLibElement` | Read | Validates GeckoLib element references and common asset issues. |

The server also exposes workspace resources such as `workspace://overview`,
`workspace://elements`, `workspace://structure`,
`workspace://geckolib/status`, and `workspace://geckolib/assets`.

## GeckoLib Support

MCreator Agent assists GeckoLib workflows through diagnostics, asset
listing/import, element creation assistance, and validation.

This support is intentionally scoped. It helps an MCP client reason about
GeckoLib-related workspace state and common asset/reference issues, but it does
not replace the GeckoLib Plugin UI or provide full end-to-end animation
authoring.

Important notes:

- GeckoLib Plugin is not bundled.
- Install GeckoLib Plugin separately in MCreator.
- GeckoLib API must be enabled in the workspace when required.
- Some plugin-specific fields may still need to be configured in the MCreator UI.
- Generic `createElement` rejects GeckoLib animated element types and directs
  clients to `createGeckoLibElement`.

See [docs/geckolib-support.md](docs/geckolib-support.md) for current GeckoLib
workflow details and known limitations.

## Safety Model

MCreator Agent is local-first:

- no cloud service is required;
- the workspace remains on the user's machine;
- the MCP endpoint is served locally by the MCreator plugin;
- tools are typed and scoped around specific workspace actions;
- write operations should be explicit MCP tool calls;
- risky changes should be proposed by the agent before being applied;
- no telemetry is implemented.

This model is meant to give AI clients useful workspace context while keeping
the editing surface smaller than unrestricted file access.

## Roadmap

- [x] MCreator 2024.4 initial support
- [x] Local MCP server
- [x] Workspace inspection
- [x] Build/run actions
- [x] GeckoLib diagnostics and asset helpers
- [ ] Expanded version compatibility
- [ ] Improved GeckoLib workflows
- [ ] More plugin-aware integrations
- [ ] Release installer scripts
- [ ] Better diagnostics UI

## Development

Requirements:

- Java 21
- Gradle wrapper included in this repository
- MCreator 2024.4 source checkout, usually in `MCreator`

Common commands:

```powershell
.\gradlew.bat compileJava -Pmcreator_path=MCreator --no-daemon
.\gradlew.bat test -Pmcreator_path=MCreator --no-daemon
.\gradlew.bat jar -Pmcreator_path=MCreator --no-daemon
.\gradlew.bat runMCreatorWithPlugin -Pmcreator_path=MCreator --no-daemon
```

If your MCreator source checkout lives elsewhere, pass the path with
`-Pmcreator_path=C:\path\to\MCreator-2024.4.52410`.

## Contributing

Contributions are welcome when they keep the project accurate, local-first, and
version-aware.

Good contribution areas include:

- validation against newer MCreator releases;
- safer workspace action handling;
- clearer MCP schemas and error messages;
- GeckoLib diagnostics and validation improvements;
- documentation and client setup examples;
- release packaging.

Please avoid broad compatibility claims unless they are backed by testing.

## Credits

Created by Nykoo.

MCreator, Minecraft, GeckoLib, and related projects belong to their respective
owners.

This project preserves MIT license attribution for
[modpotato/MCreatorMCP](https://github.com/modpotato/MCreatorMCP).

## License

MIT. See [LICENSE](LICENSE).
