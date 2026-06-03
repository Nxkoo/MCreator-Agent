# MCreatorMCP for MCreator 2024.4

This repository is a 2024.4-focused port of
[modpotato/MCreatorMCP](https://github.com/modpotato/MCreatorMCP).

It runs a local Model Context Protocol server inside MCreator and exposes tools
for inspecting a workspace, managing mod elements, building/regenerating code,
and launching the Minecraft client/server actions.

## Target

- MCreator: `2024.4`
- Reference source tag: `MCreator/MCreator@2024.4.52410`
- Plugin supported version: `2024004`
- Java: 21

The plugin is intentionally scoped to MCreator 2024.4 only. It does not try to
support 2025.2+ at the same time.

## Architecture

- `MCreatorMCP` is the Java plugin entry point. It listens for
  `MCreatorLoadedEvent`, starts the local HTTP server, and adds the `MCreator MCP`
  menu with status and restart actions.
- `McpHttpTransport` exposes the MCP JSON-RPC endpoint on localhost:
  - `POST /mcp`
  - `POST /mcp/sse`
  - `GET /health`
- `McpServer` owns the MCP protocol handlers for `initialize`, tools, and
  resources.
- `MCPToolsService` is the only layer that touches MCreator APIs such as
  `Workspace`, `ActionRegistry`, `ModElement`, and `ModElementTypeLoader`.

The stdio transport from upstream is kept in source for reference, but it is not
started by default. MCreator is a GUI process, so reading `System.in` and writing
MCP responses to stdout is fragile in this runtime.

## Port Discovery

The server first tries port `5175`. If that port is busy, it picks a free port.
The active port is written to:

```text
%USERPROFILE%\.mcreator\mcp\port
```

Use that file when configuring clients that need to discover the current HTTP
endpoint.

## Build Setup

Clone the MCreator 2024.4 source into the expected `MCreator` folder:

```powershell
git clone --depth 1 --branch 2024.4.52410 https://github.com/MCreator/MCreator.git MCreator
```

Build the plugin:

```powershell
.\gradlew.bat jar -Pmcreator_path=MCreator --no-daemon
```

The plugin zip is generated at:

```text
build\libs\MCreatorMCP.zip
```

For local development against an external MCreator source checkout:

```powershell
.\gradlew.bat compileJava -Pmcreator_path=C:\path\to\MCreator-2024.4.52410 --no-daemon
```

## Run With MCreator

```powershell
.\gradlew.bat runMCreatorWithPlugin -Pmcreator_path=MCreator --no-daemon
```

Open a workspace, then use the `MCreator MCP` menu to inspect the server status.

## MCP Surface

Tools:

- `buildWorkspace`
- `regenerateCode`
- `getWorkspaceInfo`
- `listModElements`
- `createElement`
- `deleteElement`
- `runClient`
- `runServer`

Resources:

- `workspace://overview`
- `workspace://elements`
- `workspace://structure`

## Smoke Test

After MCreator starts the plugin:

```powershell
$port = Get-Content "$env:USERPROFILE\.mcreator\mcp\port"
Invoke-RestMethod "http://localhost:$port/health"
```

Initialize MCP:

```powershell
$port = Get-Content "$env:USERPROFILE\.mcreator\mcp\port"
Invoke-RestMethod "http://localhost:$port/mcp" -Method Post -ContentType "application/json" -Body '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {}
  }
}'
```

## Codex MCP Setup

This repo includes a stdio bridge for Codex:

```text
scripts\mcreator-mcp-bridge.ps1
```

The bridge reads MCP JSON-RPC messages from stdin and forwards them to the
running MCreator HTTP endpoint. It discovers the endpoint from:

```text
%USERPROFILE%\.mcreator\mcp\port
```

Codex configuration:

```toml
[mcp_servers.mcreator]
command = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"
args = [ "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "C:\\Users\\nykoo\\OneDrive\\Documentos\\Mcreator\\scripts\\mcreator-mcp-bridge.ps1" ]
startup_timeout_sec = 30
```

Start MCreator with the plugin and open a workspace before starting/reloading
Codex, so the bridge can initialize against a live MCP server.

## License

The upstream repository contains an MIT `LICENSE` file. This port preserves that
license and upstream attribution.
