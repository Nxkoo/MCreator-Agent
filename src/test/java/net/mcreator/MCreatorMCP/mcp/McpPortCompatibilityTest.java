package net.mcreator.MCreatorMCP.mcp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class McpPortCompatibilityTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void pluginMetadataTargetsMcreator2024_4() throws Exception {
        try (InputStream stream = getClass().getClassLoader().getResourceAsStream("plugin.json")) {
            assertNotNull(stream, "plugin.json must be packaged as a plugin resource");

            JsonNode pluginJson = objectMapper.readTree(stream);

            assertEquals("mcreator_mcp_plugin", pluginJson.get("id").asText());
            assertEquals(2024004, pluginJson.get("supportedversions").get(0).asLong());
            assertEquals("2024.4", pluginJson.get("info").get("requirements").get("mcreator").asText());
        }
    }

    @Test
    void notificationWithoutIdIsNotARequest() {
        JsonRpcMessage message = new JsonRpcMessage("initialized", Map.of());

        assertTrue(message.isNotification());
        assertFalse(message.isRequest());
    }

    @Test
    void serverListsTheExpectedToolsByName() {
        McpServer server = new McpServer("test", "1.0.0-test");
        JsonRpcMessage request = new JsonRpcMessage();
        request.setId(1);
        request.setMethod("tools/list");
        request.setParams(Map.of());

        JsonRpcMessage response = server.processMessage(request);

        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) response.getResult();
        @SuppressWarnings("unchecked")
        List<McpTypes.Tool> tools = (List<McpTypes.Tool>) result.get("tools");

        assertToolExists(tools, "buildWorkspace");
        assertToolExists(tools, "regenerateCode");
        assertToolExists(tools, "getWorkspaceInfo");
        assertToolExists(tools, "listModElements");
        assertToolExists(tools, "createElement");
        assertToolExists(tools, "deleteElement");
        assertToolExists(tools, "runClient");
        assertToolExists(tools, "runServer");
        assertToolExists(tools, "getGeckoLibStatus");
        assertToolExists(tools, "listGeckoLibAssets");
        assertToolExists(tools, "importGeckoLibAssets");
        assertToolExists(tools, "createGeckoLibElement");
        assertToolExists(tools, "validateGeckoLibElement");
    }

    @Test
    void serverListsGeckoLibResources() {
        McpServer server = new McpServer("test", "1.0.0-test");
        JsonRpcMessage request = new JsonRpcMessage();
        request.setId(1);
        request.setMethod("resources/list");
        request.setParams(Map.of());

        JsonRpcMessage response = server.processMessage(request);

        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) response.getResult();
        @SuppressWarnings("unchecked")
        List<McpTypes.Resource> resources = (List<McpTypes.Resource>) result.get("resources");

        assertResourceExists(resources, "workspace://overview");
        assertResourceExists(resources, "workspace://elements");
        assertResourceExists(resources, "workspace://structure");
        assertResourceExists(resources, "workspace://geckolib/status");
        assertResourceExists(resources, "workspace://geckolib/assets");
    }

    @Test
    void unknownToolReturnsToolErrorInsteadOfSuccessPlaceholder() {
        McpServer server = new McpServer("test", "1.0.0-test");
        JsonRpcMessage request = new JsonRpcMessage();
        request.setId(1);
        request.setMethod("tools/call");
        request.setParams(Map.of("name", "missingTool", "arguments", Map.of()));

        JsonRpcMessage response = server.processMessage(request);

        @SuppressWarnings("unchecked")
        Map<String, Object> result = (Map<String, Object>) response.getResult();
        assertEquals(Boolean.TRUE, result.get("isError"));
    }

    private static void assertToolExists(List<McpTypes.Tool> tools, String name) {
        assertTrue(tools.stream().anyMatch(tool -> name.equals(tool.getName())), "Missing tool: " + name);
    }

    private static void assertResourceExists(List<McpTypes.Resource> resources, String uri) {
        assertTrue(resources.stream().anyMatch(resource -> uri.equals(resource.getUri())), "Missing resource: " + uri);
    }
}
