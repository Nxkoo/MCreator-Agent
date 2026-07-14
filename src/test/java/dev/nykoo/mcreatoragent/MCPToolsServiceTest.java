package dev.nykoo.mcreatoragent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.nykoo.mcreatoragent.mcp.McpTypes;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MCPToolsServiceTest {

    @Test
    void animatedGeckoLibTypesAreRecognizedBeforeGenericCreation() {
        assertTrue(MCPToolsService.isGeckoLibAnimatedElementType("animateditem"));
        assertTrue(MCPToolsService.isGeckoLibAnimatedElementType(" AnimatedEntity "));
        assertTrue(MCPToolsService.isGeckoLibAnimatedElementType("animatedblock"));
        assertTrue(MCPToolsService.isGeckoLibAnimatedElementType("animatedarmor"));
        assertTrue(MCPToolsService.isGeckoLibAnimatedElementType("geckoitem"));
        assertTrue(MCPToolsService.isGeckoLibAnimatedElementType(" GeckoEntity "));
    }

    @Test
    void nonGeckoLibTypesAreAllowedThroughGenericCreationPath() {
        assertFalse(MCPToolsService.isGeckoLibAnimatedElementType("item"));
        assertFalse(MCPToolsService.isGeckoLibAnimatedElementType("livingentity"));
        assertFalse(MCPToolsService.isGeckoLibAnimatedElementType(null));
    }

    @Test
    void confirmedGeckoLibCreationUsesSuccessEnvelope() throws Exception {
        MCPToolsService service = new MCPToolsService();
        GeckoLibSupportService.CreateElementResult creation = creationResult(true, List.of());

        McpTypes.ToolResult result = service.createGeckoLibCreationResult(creation);

        assertFalse(result.getIsError());
        assertTrue(parsePayload(result).get("confirmed").asBoolean());
    }

    @Test
    void unconfirmedGeckoLibCreationUsesErrorEnvelopeAndPreservesDiagnostics() throws Exception {
        MCPToolsService service = new MCPToolsService();
        GeckoLibSupportService.CreateElementResult creation = creationResult(false,
                List.of("Do not regenerate code until the failed or unknown creation postconditions are reconciled."));

        McpTypes.ToolResult result = service.createGeckoLibCreationResult(creation);
        JsonNode payload = parsePayload(result);

        assertTrue(result.getIsError());
        assertFalse(payload.get("confirmed").asBoolean());
        assertTrue(payload.get("warnings").get(0).asText().contains("Do not regenerate code"));
        assertTrue(payload.has("workspaceEntryStored"));
    }

    private GeckoLibSupportService.CreateElementResult creationResult(boolean confirmed, List<String> warnings) {
        return new GeckoLibSupportService.CreateElementResult(
                confirmed ? "Created and confirmed" : "Created but unconfirmed",
                List.of(), List.of(), confirmed, "NeedleScratch", "animateditem", "needle_scratch",
                "pass", "pass", "pass", confirmed ? "pass" : "unknown", List.of(), warnings);
    }

    private JsonNode parsePayload(McpTypes.ToolResult result) throws Exception {
        return new ObjectMapper().readTree(result.getContent().get(0).getText());
    }
}
