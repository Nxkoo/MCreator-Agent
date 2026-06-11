package dev.nykoo.mcreatormcp;

import dev.nykoo.mcreatormcp.mcp.McpServer;
import dev.nykoo.mcreatormcp.mcp.McpTypes;
import net.mcreator.element.ModElementType;
import net.mcreator.element.ModElementTypeLoader;
import net.mcreator.workspace.Workspace;
import net.mcreator.workspace.elements.ModElement;
import net.mcreator.ui.MCreator;
import net.mcreator.ui.variants.modmaker.ModMaker;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.io.File;
import java.io.IOException;
import javax.swing.SwingUtilities;

/**
 * Service that implements MCreator tools for the MCP server.
 * This replaces the old IPC-based communication with direct integration.
 */
public class MCPToolsService {

    private static final Logger LOG = LogManager.getLogger("MCP-Tools");
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final GeckoLibSupportService geckoLibSupportService = new GeckoLibSupportService();

    /**
     * Register all MCreator tools with the MCP server
     */
    public void registerTools(McpServer mcpServer, MCreator mcreator) {
        LOG.info("Registering MCreator tools with MCP server");

        // Workspace management tools
        mcpServer.registerHandler("buildWorkspace", params -> executeBuildWorkspace(mcreator));
        mcpServer.registerHandler("getWorkspaceInfo", params -> getWorkspaceInfo(mcreator));
        mcpServer.registerHandler("regenerateCode", params -> executeRegenerateCode(mcreator));

        // Element operations
        mcpServer.registerHandler("listModElements", params -> listModElements(mcreator, params));
        mcpServer.registerHandler("createElement", params -> createElement(mcreator, params));
        mcpServer.registerHandler("deleteElement", params -> deleteElement(mcreator, params));
        mcpServer.registerHandler("setModElementLock", params -> setModElementLock(mcreator, params));

        // Testing tools
        mcpServer.registerHandler("runClient", params -> executeRunClient(mcreator));
        mcpServer.registerHandler("runServer", params -> executeRunServer(mcreator));

        // GeckoLib tools are always registered and report clear errors when the plugin is unavailable.
        mcpServer.registerHandler("getGeckoLibStatus", params -> getGeckoLibStatus(mcreator));
        mcpServer.registerHandler("listGeckoLibAssets", params -> listGeckoLibAssets(mcreator));
        mcpServer.registerHandler("importGeckoLibAssets", params -> importGeckoLibAssets(mcreator, params));
        mcpServer.registerHandler("createGeckoLibElement", params -> createGeckoLibElement(mcreator, params));
        mcpServer.registerHandler("validateGeckoLibElement", params -> validateGeckoLibElement(mcreator, params));

        LOG.info("Registered MCreator tools with GeckoLib support");
    }

    /**
     * Build workspace tool
     */
    private McpTypes.ToolResult executeBuildWorkspace(MCreator mcreator) {
        LOG.info("Executing buildWorkspace tool");

        try {
            if (mcreator.getWorkspace() == null) {
                return createErrorResult("No workspace loaded");
            }

            return dispatchOnEdt("Workspace build initiated successfully",
                    () -> mcreator.getActionRegistry().buildWorkspace.doAction());

        } catch (Exception e) {
            LOG.error("Error building workspace", e);
            return createErrorResult("Failed to build workspace: " + e.getMessage());
        }
    }

    /**
     * Get workspace information
     */
    private McpTypes.ToolResult getWorkspaceInfo(MCreator mcreator) {
        LOG.info("Executing getWorkspaceInfo tool");

        try {
            Workspace workspace = mcreator.getWorkspace();
            if (workspace == null) {
                return createErrorResult("No workspace loaded");
            }

            Map<String, Object> info = new HashMap<>();
            info.put("name", workspace.getWorkspaceSettings().getModName());
            info.put("version", workspace.getWorkspaceSettings().getVersion());
            info.put("author", workspace.getWorkspaceSettings().getAuthor());
            info.put("description", workspace.getWorkspaceSettings().getDescription());
            info.put("mcreatorVersion", String.valueOf(workspace.getMCreatorVersion()));
            info.put("elementCount", workspace.getModElements().size());
            info.put("workspaceFolder", workspace.getWorkspaceFolder().getAbsolutePath());

            String infoJson = objectMapper.writeValueAsString(info);
            return createSuccessResult("Workspace information retrieved:\n" + infoJson);

        } catch (Exception e) {
            LOG.error("Error getting workspace info", e);
            return createErrorResult("Failed to get workspace info: " + e.getMessage());
        }
    }

    /**
     * Regenerate code tool
     */
    private McpTypes.ToolResult executeRegenerateCode(MCreator mcreator) {
        LOG.info("Executing regenerateCode tool");

        try {
            if (mcreator.getWorkspace() == null) {
                return createErrorResult("No workspace loaded");
            }

            return dispatchOnEdt("Code regeneration initiated successfully",
                    () -> mcreator.getActionRegistry().regenerateCode.doAction());

        } catch (Exception e) {
            LOG.error("Error regenerating code", e);
            return createErrorResult("Failed to regenerate code: " + e.getMessage());
        }
    }

    /**
     * List mod elements tool
     */
    private McpTypes.ToolResult listModElements(MCreator mcreator, Map<String, Object> params) {
        LOG.info("Executing listModElements tool");

        try {
            Workspace workspace = mcreator.getWorkspace();
            if (workspace == null) {
                return createErrorResult("No workspace loaded");
            }

            String elementType = params == null ? null : (String) params.get("elementType");
            Collection<ModElement> elements = workspace.getModElements();

            // Filter by type if specified
            if (elementType != null && !elementType.trim().isEmpty()) {
                elements = elements.stream()
                    .filter(element -> element.getType().getRegistryName().equalsIgnoreCase(elementType.trim()))
                    .collect(Collectors.toList());
            }

            List<Map<String, Object>> elementList = elements.stream()
                .map(this::modElementToMap)
                .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("elements", elementList);
            result.put("count", elementList.size());
            result.put("filteredBy", elementType);

            String resultJson = objectMapper.writeValueAsString(result);
            return createSuccessResult("Found " + elementList.size() + " mod elements:\n" + resultJson);

        } catch (Exception e) {
            LOG.error("Error listing mod elements", e);
            return createErrorResult("Failed to list mod elements: " + e.getMessage());
        }
    }

    /**
     * Create element tool
     */
    private McpTypes.ToolResult createElement(MCreator mcreator, Map<String, Object> params) {
        String elementType = params == null ? null : (String) params.get("elementType");
        String elementName = params == null ? null : (String) params.get("elementName");

        LOG.info("Executing createElement tool: {} of type {}", elementName, elementType);

        try {
            Workspace workspace = mcreator.getWorkspace();
            if (workspace == null) {
                return createErrorResult("No workspace loaded");
            }

            if (elementName == null || elementName.trim().isEmpty()) {
                return createErrorResult("Element name is required");
            }

            if (elementType == null || elementType.trim().isEmpty()) {
                return createErrorResult("Element type is required");
            }

            if (isGeckoLibAnimatedElementType(elementType)) {
                return createErrorResult("This is a GeckoLib element type. Use createGeckoLibElement instead.");
            }

            // Find the ModElementType
            ModElementType type = null;
            for (ModElementType met : ModElementTypeLoader.getAllModElementTypes()) {
                if (met.getRegistryName().equalsIgnoreCase(elementType.trim())) {
                    type = met;
                    break;
                }
            }

            if (type == null) {
                return createErrorResult("Unknown element type: " + elementType);
            }

            // Check if element already exists
            if (workspace.getModElementByName(elementName.trim()) != null) {
                return createErrorResult("Element with name '" + elementName.trim() + "' already exists");
            }

            // Create the element on EDT
            final ModElementType finalType = type;
            final String finalName = elementName.trim();
            
            runOnEdtAndWait(() -> {
                try {
                    ModElement element = new ModElement(workspace, finalName, finalType);
                    workspace.addModElement(element);
                    createDefaultElementDefinition(workspace, element);
                    workspace.markDirty();
                    refreshWorkspaceUi(mcreator);
                } catch (IOException e) {
                    throw new RuntimeException("Failed to create default element definition", e);
                }
            });

            return createSuccessResult("Element '" + elementName + "' of type '" + elementType + "' created successfully");

        } catch (Exception e) {
            LOG.error("Error creating element", e);
            return createErrorResult("Failed to create element: " + e.getMessage());
        }
    }

    /**
     * Delete element tool
     */
    private McpTypes.ToolResult deleteElement(MCreator mcreator, Map<String, Object> params) {
        String elementName = params == null ? null : (String) params.get("elementName");

        LOG.info("Executing deleteElement tool: {}", elementName);

        try {
            Workspace workspace = mcreator.getWorkspace();
            if (workspace == null) {
                return createErrorResult("No workspace loaded");
            }

            if (elementName == null || elementName.trim().isEmpty()) {
                return createErrorResult("Element name is required");
            }

            ModElement element = workspace.getModElementByName(elementName.trim());
            if (element == null) {
                return createErrorResult("Element '" + elementName + "' not found");
            }

            // Delete the element on EDT
            runOnEdtAndWait(() -> {
                workspace.removeModElement(element);
                workspace.markDirty();
                refreshWorkspaceUi(mcreator);
            });

            return createSuccessResult("Element '" + elementName + "' deleted successfully");

        } catch (Exception e) {
            LOG.error("Error deleting element", e);
            return createErrorResult("Failed to delete element: " + e.getMessage());
        }
    }

    /**
     * Set the desired code lock state of a mod element without regenerating or building the workspace.
     */
    private McpTypes.ToolResult setModElementLock(MCreator mcreator, Map<String, Object> params) {
        String elementName = params == null ? null : (String) params.get("elementName");
        Object lockedValue = params == null ? null : params.get("locked");

        LOG.info("Executing setModElementLock tool: {} -> {}", elementName, lockedValue);

        try {
            Workspace workspace = mcreator.getWorkspace();
            if (workspace == null) {
                return createErrorResult("No workspace loaded");
            }

            if (elementName == null || elementName.trim().isEmpty()) {
                return createErrorResult("Element name is required");
            }

            if (!(lockedValue instanceof Boolean locked)) {
                return createErrorResult("Locked state must be a boolean");
            }

            ModElement element = workspace.getModElementByName(elementName.trim());
            if (element == null) {
                return createErrorResult("Element '" + elementName + "' not found");
            }

            boolean previousState = element.isCodeLocked();
            if (previousState != locked) {
                runOnEdtAndWait(() -> {
                    element.setCodeLock(locked);
                    if (element.isCodeLocked() != previousState) {
                        workspace.markDirty();
                        refreshWorkspaceUi(mcreator);
                    }
                });
            }

            if (element.isCodeLocked() != locked) {
                return createErrorResult("Element '" + element.getName() + "' does not support the requested lock state");
            }

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("elementName", element.getName());
            result.put("locked", element.isCodeLocked());
            result.put("changed", previousState != element.isCodeLocked());
            return createJsonResult(result);

        } catch (Exception e) {
            LOG.error("Error setting mod element lock", e);
            return createErrorResult("Failed to set mod element lock: " + e.getMessage());
        }
    }

    /**
     * Run client tool
     */
    private McpTypes.ToolResult executeRunClient(MCreator mcreator) {
        LOG.info("Executing runClient tool");

        try {
            if (mcreator.getWorkspace() == null) {
                return createErrorResult("No workspace loaded");
            }

            return dispatchOnEdt("Minecraft client start initiated successfully",
                    () -> mcreator.getActionRegistry().runClient.doAction());

        } catch (Exception e) {
            LOG.error("Error running client", e);
            return createErrorResult("Failed to run client: " + e.getMessage());
        }
    }

    /**
     * Run server tool
     */
    private McpTypes.ToolResult executeRunServer(MCreator mcreator) {
        LOG.info("Executing runServer tool");

        try {
            if (mcreator.getWorkspace() == null) {
                return createErrorResult("No workspace loaded");
            }

            return dispatchOnEdt("Minecraft server start initiated successfully",
                    () -> mcreator.getActionRegistry().runServer.doAction());

        } catch (Exception e) {
            LOG.error("Error running server", e);
            return createErrorResult("Failed to run server: " + e.getMessage());
        }
    }

    private McpTypes.ToolResult getGeckoLibStatus(MCreator mcreator) {
        try {
            return createJsonResult(geckoLibSupportService.getStatus(mcreator));
        } catch (Exception e) {
            LOG.error("Error getting GeckoLib status", e);
            return createErrorResult("Failed to get GeckoLib status: " + e.getMessage());
        }
    }

    private McpTypes.ToolResult listGeckoLibAssets(MCreator mcreator) {
        try {
            Workspace workspace = mcreator.getWorkspace();
            if (workspace == null) {
                return createErrorResult("No workspace loaded");
            }
            return createJsonResult(geckoLibSupportService.listAssets(geckoLibSupportService.assetRootsForWorkspace(workspace)));
        } catch (Exception e) {
            LOG.error("Error listing GeckoLib assets", e);
            return createErrorResult("Failed to list GeckoLib assets: " + e.getMessage());
        }
    }

    private McpTypes.ToolResult importGeckoLibAssets(MCreator mcreator, Map<String, Object> params) {
        try {
            Workspace workspace = mcreator.getWorkspace();
            if (workspace == null) {
                return createErrorResult("No workspace loaded");
            }
            GeckoLibSupportService.AssetImportRequest request = objectMapper.convertValue(params,
                    GeckoLibSupportService.AssetImportRequest.class);
            GeckoLibSupportService.AssetImportResult result = geckoLibSupportService.importAssets(
                    geckoLibSupportService.assetRootsForWorkspace(workspace), request);
            SwingUtilities.invokeLater(() -> refreshWorkspaceUi(mcreator));
            return createJsonResult(result);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return createErrorResult(e.getMessage());
        } catch (Exception e) {
            LOG.error("Error importing GeckoLib assets", e);
            return createErrorResult("Failed to import GeckoLib assets: " + e.getMessage());
        }
    }

    private McpTypes.ToolResult createGeckoLibElement(MCreator mcreator, Map<String, Object> params) {
        try {
            return createSuccessResult(geckoLibSupportService.createElement(mcreator, params));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return createErrorResult(e.getMessage());
        } catch (Exception e) {
            LOG.error("Error creating GeckoLib element", e);
            return createErrorResult("Failed to create GeckoLib element: " + e.getMessage());
        }
    }

    private McpTypes.ToolResult validateGeckoLibElement(MCreator mcreator, Map<String, Object> params) {
        try {
            Workspace workspace = mcreator.getWorkspace();
            String elementName = params == null ? null : (String) params.get("elementName");
            return createJsonResult(geckoLibSupportService.validateElement(workspace, elementName));
        } catch (Exception e) {
            LOG.error("Error validating GeckoLib element", e);
            return createErrorResult("Failed to validate GeckoLib element: " + e.getMessage());
        }
    }

    private McpTypes.ToolResult dispatchOnEdt(String successMessage, Runnable action) {
        if (SwingUtilities.isEventDispatchThread()) {
            action.run();
            return createSuccessResult(successMessage);
        }

        CompletableFuture<Void> dispatch = new CompletableFuture<>();
        SwingUtilities.invokeLater(() -> {
            try {
                action.run();
                dispatch.complete(null);
            } catch (Throwable t) {
                dispatch.completeExceptionally(t);
            }
        });

        try {
            dispatch.get(5, TimeUnit.SECONDS);
            return createSuccessResult(successMessage);
        } catch (Exception e) {
            return createErrorResult("Failed to dispatch action on MCreator UI thread: " + e.getMessage());
        }
    }

    private void runOnEdtAndWait(Runnable action) throws Exception {
        if (SwingUtilities.isEventDispatchThread()) {
            action.run();
        } else {
            SwingUtilities.invokeAndWait(action);
        }
    }

    private void refreshWorkspaceUi(MCreator mcreator) {
        try {
            if (mcreator instanceof ModMaker modMaker && modMaker.getWorkspacePanel() != null) {
                modMaker.getWorkspacePanel().reloadElementsInCurrentTab();
            } else {
                mcreator.reloadWorkspaceTabContents();
            }
        } catch (Exception e) {
            LOG.warn("Workspace model changed, but UI refresh failed", e);
        }
    }

    private void createDefaultElementDefinition(Workspace workspace, ModElement element) throws IOException {
        String type = element.getType().getRegistryName();
        if (!"item".equals(type) && !"tool".equals(type)) {
            return;
        }

        File elementsDir = new File(workspace.getWorkspaceFolder(), "elements");
        if (!elementsDir.exists() && !elementsDir.mkdirs()) {
            throw new IOException("Could not create elements directory: " + elementsDir);
        }

        File definitionFile = new File(elementsDir, element.getName() + ".mod.json");
        if (definitionFile.exists()) {
            return;
        }

        Map<String, Object> root = loadExistingDefinitionTemplate(elementsDir, type);
        if (root == null) {
            root = "tool".equals(type) ? createToolDefinitionTemplate() : createItemDefinitionTemplate();
        }

        root.put("_fv", workspace.getMCreatorVersion() >= 2024004 ? 73 : 0);
        root.put("_type", type);

        Object definition = root.get("definition");
        if (definition instanceof Map<?, ?> definitionMap) {
            @SuppressWarnings("unchecked")
            Map<String, Object> mutableDefinition = (Map<String, Object>) definitionMap;
            mutableDefinition.put("name", element.getName());
        }

        objectMapper.writerWithDefaultPrettyPrinter().writeValue(definitionFile, root);
    }

    private Map<String, Object> loadExistingDefinitionTemplate(File elementsDir, String type) {
        File[] files = elementsDir.listFiles((dir, name) -> name.endsWith(".mod.json"));
        if (files == null) {
            return null;
        }

        for (File file : files) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> root = objectMapper.readValue(file, Map.class);
                if (type.equals(root.get("_type")) && root.get("definition") instanceof Map<?, ?>) {
                    return root;
                }
            } catch (IOException e) {
                LOG.debug("Skipping element definition template {}", file, e);
            }
        }
        return null;
    }

    private Map<String, Object> createItemDefinitionTemplate() {
        Map<String, Object> definition = new LinkedHashMap<>();
        definition.put("renderType", 0);
        definition.put("texture", "");
        definition.put("customModelName", "Normal");
        definition.put("customProperties", new LinkedHashMap<>());
        definition.put("states", new ArrayList<>());
        definition.put("name", "");
        definition.put("rarity", "COMMON");
        definition.put("creativeTabs", new ArrayList<>());
        definition.put("stackSize", 64);
        definition.put("enchantability", 0);
        definition.put("useDuration", 0);
        definition.put("toolType", 1.0);
        definition.put("damageCount", 0);
        definition.put("recipeRemainder", Map.of("value", ""));
        definition.put("destroyAnyBlock", false);
        definition.put("immuneToFire", false);
        definition.put("stayInGridWhenCrafting", false);
        definition.put("damageOnCrafting", false);
        definition.put("enableMeleeDamage", false);
        definition.put("damageVsEntity", 0.0);
        definition.put("specialInformation", Map.of("fixedValue", new ArrayList<>()));
        definition.put("glowCondition", Map.of("fixedValue", false));
        definition.put("inventorySize", 9);
        definition.put("inventoryStackSize", 64);
        definition.put("enableRanged", false);
        definition.put("shootConstantly", false);
        definition.put("rangedItemChargesPower", false);
        definition.put("projectile", Map.of("value", "Arrow"));
        definition.put("projectileDisableAmmoCheck", false);
        definition.put("isFood", false);
        definition.put("nutritionalValue", 4);
        definition.put("saturation", 0.3);
        definition.put("eatResultItem", Map.of("value", ""));
        definition.put("isMeat", false);
        definition.put("isAlwaysEdible", false);
        definition.put("animation", "none");
        definition.put("isMusicDisc", false);
        definition.put("musicDiscMusic", Map.of("value", ""));
        definition.put("musicDiscDescription", "");
        definition.put("musicDiscLengthInTicks", 100);
        definition.put("musicDiscAnalogOutput", 0);

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("_fv", 73);
        root.put("_type", "item");
        root.put("definition", definition);
        return root;
    }

    private Map<String, Object> createToolDefinitionTemplate() {
        Map<String, Object> definition = new LinkedHashMap<>();
        definition.put("toolType", "Pickaxe");
        definition.put("renderType", 0);
        definition.put("blockingRenderType", 0);
        definition.put("texture", "");
        definition.put("customModelName", "Normal");
        definition.put("blockingModelName", "Normal blocking");
        definition.put("name", "");
        definition.put("specialInformation", Map.of("fixedValue", new ArrayList<>()));
        definition.put("creativeTabs", List.of(Map.of("value", "TOOLS")));
        definition.put("efficiency", 4.0);
        definition.put("attackSpeed", 1.0);
        definition.put("enchantability", 2);
        definition.put("damageVsEntity", 4.0);
        definition.put("usageCount", 100);
        definition.put("glowCondition", Map.of("fixedValue", false));
        definition.put("repairItems", new ArrayList<>());
        definition.put("immuneToFire", false);
        definition.put("blockDropsTier", "WOOD");
        definition.put("blocksAffected", new ArrayList<>());
        definition.put("stayInGridWhenCrafting", false);
        definition.put("damageOnCrafting", false);

        Map<String, Object> root = new LinkedHashMap<>();
        root.put("_fv", 73);
        root.put("_type", "tool");
        root.put("definition", definition);
        return root;
    }

    /**
     * Helper method to convert ModElement to Map
     */
    private Map<String, Object> modElementToMap(ModElement element) {
        Map<String, Object> map = new HashMap<>();
        map.put("name", element.getName());
        map.put("type", element.getType().getRegistryName());
        map.put("isLocked", element.isCodeLocked());
        map.put("sortIndex", element.getName());
        return map;
    }

    /**
     * Helper method to create success result
     */
    private McpTypes.ToolResult createSuccessResult(String message) {
        List<McpTypes.ToolContent> content = List.of(
            new McpTypes.ToolContent("text", message)
        );
        return new McpTypes.ToolResult(content, false);
    }

    private McpTypes.ToolResult createJsonResult(Object value) throws IOException {
        return createSuccessResult(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(value));
    }

    static boolean isGeckoLibAnimatedElementType(String elementType) {
        return elementType != null
                && GeckoLibSupportService.ANIMATED_ELEMENT_TYPES.contains(elementType.trim().toLowerCase(Locale.ENGLISH));
    }

    /**
     * Helper method to create error result
     */
    private McpTypes.ToolResult createErrorResult(String message) {
        List<McpTypes.ToolContent> content = List.of(
            new McpTypes.ToolContent("text", "Error: " + message)
        );
        return new McpTypes.ToolResult(content, true);
    }
}
