package dev.nykoo.mcreatoragent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import net.mcreator.ui.MCreator;
import net.mcreator.workspace.Workspace;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Imports Blockbench Java/item-style JSON models into MCreator resource paths and rewrites
 * texture references to {@code <modid>:item/<name>}.
 */
public final class BlockbenchItemModelService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public ImportResult importItemModel(MCreator mcreator, Map<String, Object> params) throws IOException {
        Workspace workspace = mcreator == null ? null : mcreator.getWorkspace();
        if (workspace == null) {
            throw new IllegalArgumentException("No workspace loaded");
        }
        String sourceModelPath = stringParam(params, "sourceModelPath");
        if (sourceModelPath == null || sourceModelPath.isBlank()) {
            throw new IllegalArgumentException("sourceModelPath is required");
        }
        Path sourceModel = Path.of(sourceModelPath).toAbsolutePath().normalize();
        if (!Files.isRegularFile(sourceModel)) {
            throw new IllegalArgumentException("sourceModelPath is not a file: " + sourceModel);
        }
        if (!sourceModel.getFileName().toString().endsWith(".json")) {
            throw new IllegalArgumentException("sourceModelPath must be a .json file");
        }

        String targetName = stringParam(params, "targetName");
        if (targetName == null || targetName.isBlank()) {
            String fileName = sourceModel.getFileName().toString();
            targetName = fileName.endsWith(".json") ? fileName.substring(0, fileName.length() - 5) : fileName;
        }
        targetName = sanitizeRegistryName(targetName);

        boolean overwrite = params == null || params.get("overwrite") == null
                || Boolean.TRUE.equals(params.get("overwrite"))
                || "true".equalsIgnoreCase(String.valueOf(params.get("overwrite")));

        String modId = workspace.getWorkspaceSettings().getModID();
        Path workspaceDir = workspace.getWorkspaceFolder().toPath();
        Path assets = workspaceDir.resolve("src/main/resources/assets").resolve(modId);
        Path customModel = assets.resolve("models/custom").resolve(targetName + ".json");
        Path itemModel = assets.resolve("models/item").resolve(targetName + ".json");
        Path itemTexture = assets.resolve("textures/item").resolve(targetName + ".png");

        List<String> warnings = new ArrayList<>();
        List<Map<String, String>> written = new ArrayList<>();

        String sourceTexturePath = stringParam(params, "sourceTexturePath");
        if (sourceTexturePath != null && !sourceTexturePath.isBlank()) {
            Path sourceTexture = Path.of(sourceTexturePath).toAbsolutePath().normalize();
            if (!Files.isRegularFile(sourceTexture)) {
                throw new IllegalArgumentException("sourceTexturePath is not a file: " + sourceTexture);
            }
            Files.createDirectories(itemTexture.getParent());
            if (Files.exists(itemTexture) && !overwrite) {
                warnings.add("Skipped texture (exists): " + relative(workspaceDir, itemTexture));
            } else {
                Files.copy(sourceTexture, itemTexture, StandardCopyOption.REPLACE_EXISTING);
                written.add(Map.of("kind", "texture", "path", relative(workspaceDir, itemTexture)));
            }
        } else if (!Files.isRegularFile(itemTexture)) {
            warnings.add("No sourceTexturePath and texture missing at " + relative(workspaceDir, itemTexture)
                    + "; model texture refs will still point there.");
        }

        JsonNode root = MAPPER.readTree(sourceModel.toFile());
        if (!(root instanceof ObjectNode objectNode)) {
            throw new IllegalArgumentException("Item model root must be a JSON object");
        }

        // Strip Bedrock-only noise that confuses some loaders / editors.
        objectNode.remove("format_version");
        objectNode.remove("credit");
        objectNode.remove("groups");

        String textureLoc = modId + ":item/" + targetName;
        ObjectNode textures = objectNode.has("textures") && objectNode.get("textures").isObject()
                ? (ObjectNode) objectNode.get("textures")
                : objectNode.putObject("textures");
        Iterator<String> fieldNames = textures.fieldNames();
        List<String> keys = new ArrayList<>();
        fieldNames.forEachRemaining(keys::add);
        if (keys.isEmpty()) {
            textures.put("layer0", textureLoc);
            textures.put("particle", textureLoc);
        } else {
            for (String key : keys) {
                textures.put(key, textureLoc);
            }
            if (!textures.has("particle")) {
                textures.put("particle", textureLoc);
            }
        }

        Files.createDirectories(customModel.getParent());
        if (Files.exists(customModel) && !overwrite) {
            throw new IllegalArgumentException("Custom model already exists (overwrite=false): "
                    + relative(workspaceDir, customModel));
        }
        MAPPER.writerWithDefaultPrettyPrinter().writeValue(customModel.toFile(), objectNode);
        written.add(Map.of("kind", "custom_model", "path", relative(workspaceDir, customModel)));

        ObjectNode itemRoot = MAPPER.createObjectNode();
        itemRoot.put("parent", modId + ":custom/" + targetName);
        ObjectNode itemTextures = itemRoot.putObject("textures");
        // Preserve common Blockbench multi-slot keys by pointing all to the same texture.
        for (String key : keys.isEmpty() ? List.of("layer0") : keys) {
            itemTextures.put(key, textureLoc);
        }
        itemTextures.put("particle", textureLoc);

        Files.createDirectories(itemModel.getParent());
        if (Files.exists(itemModel) && !overwrite) {
            throw new IllegalArgumentException("Item model already exists (overwrite=false): "
                    + relative(workspaceDir, itemModel));
        }
        MAPPER.writerWithDefaultPrettyPrinter().writeValue(itemModel.toFile(), itemRoot);
        written.add(Map.of("kind", "item_model", "path", relative(workspaceDir, itemModel)));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("targetName", targetName);
        result.put("modId", modId);
        result.put("textureLocation", textureLoc);
        result.put("written", written);
        result.put("warnings", warnings);
        result.put("message", "Imported Blockbench item model '" + targetName + "' with rewritten texture refs.");
        return new ImportResult(targetName, modId, textureLoc, written, warnings,
                "Imported Blockbench item model '" + targetName + "' with rewritten texture refs.");
    }

    private static String sanitizeRegistryName(String name) {
        String cleaned = name.trim().toLowerCase().replace(' ', '_');
        cleaned = cleaned.replaceAll("[^a-z0-9_/.-]", "_");
        if (cleaned.endsWith(".json")) {
            cleaned = cleaned.substring(0, cleaned.length() - 5);
        }
        return cleaned;
    }

    private static String relative(Path workspaceDir, Path file) {
        return workspaceDir.relativize(file.toAbsolutePath().normalize()).toString().replace('\\', '/');
    }

    private static String stringParam(Map<String, Object> params, String key) {
        if (params == null || !params.containsKey(key) || params.get(key) == null) {
            return null;
        }
        return String.valueOf(params.get(key));
    }

    public record ImportResult(String targetName, String modId, String textureLocation,
                               List<Map<String, String>> written, List<String> warnings, String message) {
    }
}
