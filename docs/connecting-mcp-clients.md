# Connecting MCP Clients to MCreator Agent

This guide covers how to configure different AI coding tools to connect to the
MCreator Agent MCP server.

## Prerequisites

- MCreator must be running with the MCreator Agent plugin loaded
- A workspace must be open in MCreator
- The MCP server starts automatically on `http://localhost:5175/mcp` (or the
  next free port if 5175 is busy)

The active port is written to:

```
%USERPROFILE%\.mcreator\mcp\port
```

Quick health check:

```powershell
$port = Get-Content "$env:USERPROFILE\.mcreator\mcp\port"
Invoke-RestMethod "http://localhost:$port/health"
```

---

## OpenCode (CLI)

**Config file:** `~/.config/opencode/opencode.json`

Add to the `mcp` section:

```json
{
  "mcp": {
    "mcreator-agent": {
      "type": "remote",
      "url": "http://localhost:5175/mcp",
      "enabled": true
    }
  }
}
```

After saving, restart opencode. The tools become available in the current
session.

---

## Codex (OpenAI / VS Code with GitHub Copilot)

**Config file:** `.vscode/mcp.json` in your project root (workspace level) or
user `mcp.json` (global).

### Remote (HTTP) — recommended

```json
{
  "servers": {
    "mcreator-agent": {
      "type": "http",
      "url": "http://localhost:5175/mcp"
    }
  }
}
```

### Local (stdio via PowerShell bridge)

```json
{
  "servers": {
    "mcreator-agent": {
      "type": "stdio",
      "command": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
      "args": [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        "D:\\My Projects\\MCreator Agent\\scripts\\mcreator-mcp-bridge.ps1"
      ]
    }
  }
}
```

After saving, click **Start** in the `mcp.json` editor or reload the VS Code
window (`Ctrl+Shift+P` → `Developer: Reload Window`).

---

## Antigravity (Google AI IDE)

**Config file:** `%USERPROFILE%\.gemini\antigravity\mcp_config.json`

### Local (stdio via PowerShell bridge)

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
        "D:\\My Projects\\MCreator Agent\\scripts\\mcreator-mcp-bridge.ps1"
      ]
    }
  }
}
```

After saving, restart Antigravity. The MCP server appears in the agent panel
under **MCP Servers**.

> **Note:** Antigravity uses `serverUrl` (not `url`) for HTTP-based MCP servers.
> For local stdio servers, use `command`/`args` as shown above.

---

## Section for LLMs / AI Agents

When you (an LLM) are connected to MCreator Agent, the following MCP tools are
available to inspect and interact with an MCreator workspace:

### Available Tools

| Tool | Description |
|---|---|
| `getWorkspaceInfo` | Returns workspace metadata, MCreator version, element count |
| `listModElements` | Lists mod elements, optionally filtered by type |
| `createElement` | Creates a mod element (`elementType`, `elementName`) |
| `deleteElement` | Deletes a mod element by name |
| `setModElementLock` | Locks or unlocks a mod element's generated code |
| `regenerateCode` | Triggers MCreator code regeneration |
| `buildWorkspace` | Starts a workspace build |
| `runClient` | Launches Minecraft client |
| `runServer` | Launches Minecraft server |
| `getGeckoLibStatus` | GeckoLib Plugin/API diagnostics |
| `listGeckoLibAssets` | Lists geo models, animations, textures |
| `importGeckoLibAssets` | Imports GeckoLib assets |
| `createGeckoLibElement` | Creates GeckoLib animated elements |
| `validateGeckoLibElement` | Validates element references and assets |

### Available Resources

- `workspace://overview`
- `workspace://elements`
- `workspace://structure`
- `workspace://geckolib/status`
- `workspace://geckolib/assets`

### Connection Detection

To detect whether MCreator Agent is running, make a POST request to the MCP
endpoint with `tools/list`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

If the server responds with the tool list, the agent is connected and ready.

### Usage Example

To create a simple item called "Ruby":

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "createElement",
    "arguments": {
      "elementType": "item",
      "elementName": "Ruby"
    }
  }
}
```

### Important Notes

- MCreator must be running with the plugin loaded for tools to work
- GeckoLib tools require the GeckoLib Plugin to be installed in MCreator
- `createElement` rejects GeckoLib animated types — use `createGeckoLibElement`
  instead
- The server is local-only. No cloud service is involved.
