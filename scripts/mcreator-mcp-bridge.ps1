param(
    [string] $Endpoint = ""
)

$ErrorActionPreference = "Stop"

function Resolve-MCreatorMcpEndpoint {
    param([string] $ConfiguredEndpoint)

    if (-not [string]::IsNullOrWhiteSpace($ConfiguredEndpoint)) {
        return $ConfiguredEndpoint
    }

    if (-not [string]::IsNullOrWhiteSpace($env:MCREATOR_MCP_URL)) {
        return $env:MCREATOR_MCP_URL
    }

    if (-not [string]::IsNullOrWhiteSpace($env:MCREATOR_MCP_PORT)) {
        return "http://127.0.0.1:$($env:MCREATOR_MCP_PORT)/mcp"
    }

    $portFile = Join-Path $env:USERPROFILE ".mcreator\mcp\port"
    if (-not (Test-Path $portFile)) {
        throw "MCreator Agent port file not found: $portFile. Start MCreator with the plugin and open a workspace first."
    }

    $port = (Get-Content $portFile -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($port)) {
        throw "MCreator Agent port file is empty: $portFile"
    }

    return "http://127.0.0.1:$port/mcp"
}

$resolvedEndpoint = Resolve-MCreatorMcpEndpoint $Endpoint

while ($null -ne ($line = [Console]::In.ReadLine())) {
    if ([string]::IsNullOrWhiteSpace($line)) {
        continue
    }

    try {
        $response = Invoke-WebRequest -Uri $resolvedEndpoint -Method Post -ContentType "application/json" -Body $line -UseBasicParsing
        if ($response.StatusCode -ne 204 -and -not [string]::IsNullOrWhiteSpace($response.Content)) {
            [Console]::Out.WriteLine($response.Content)
            [Console]::Out.Flush()
        }
    } catch {
        $id = $null
        try {
            $request = $line | ConvertFrom-Json
            if ($null -ne $request.id) {
                $id = $request.id
            }
        } catch {
            $id = $null
        }

        $errorPayload = [ordered]@{
            jsonrpc = "2.0"
            id = $id
            error = [ordered]@{
                code = -32000
                message = $_.Exception.Message
            }
        } | ConvertTo-Json -Compress -Depth 6

        [Console]::Out.WriteLine($errorPayload)
        [Console]::Out.Flush()
    }
}
