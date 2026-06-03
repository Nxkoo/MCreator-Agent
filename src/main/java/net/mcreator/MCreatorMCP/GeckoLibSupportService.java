package net.mcreator.MCreatorMCP;

import com.fasterxml.jackson.databind.ObjectMapper;
import net.mcreator.element.GeneratableElement;
import net.mcreator.element.ModElementType;
import net.mcreator.element.ModElementTypeLoader;
import net.mcreator.java.JavaConventions;
import net.mcreator.minecraft.RegistryNameFixer;
import net.mcreator.plugin.Plugin;
import net.mcreator.plugin.PluginLoader;
import net.mcreator.plugin.modapis.ModAPIManager;
import net.mcreator.ui.MCreator;
import net.mcreator.ui.workspace.resources.TextureType;
import net.mcreator.workspace.Workspace;
import net.mcreator.workspace.WorkspaceFolderManager;
import net.mcreator.workspace.elements.ModElement;

import javax.swing.SwingUtilities;
import java.io.IOException;
import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public final class GeckoLibSupportService {

    public static final String PLUGIN_ID = "geckolib_plugin";
    public static final String API_ID = "geckolib";
    public static final Set<String> ANIMATED_ELEMENT_TYPES = Set.of(
            "animatedentity", "animateditem", "animatedblock", "animatedarmor");

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Set<String> TEXTURE_EXTENSIONS = Set.of(".png");

    public GeckoLibStatus getStatus(MCreator mcreator) {
        return getStatus(mcreator == null ? null : mcreator.getWorkspace());
    }

    public GeckoLibStatus getStatus(Workspace workspace) {
        Map<String, Object> debug = new LinkedHashMap<>();
        List<String> problems = new ArrayList<>();

        Plugin plugin = findGeckoLibPlugin();
        boolean pluginLoaded = plugin != null && plugin.isLoaded();
        if (plugin != null) {
            debug.put("pluginVersion", plugin.getPluginVersion());
            debug.put("pluginLoadFailure", plugin.getLoadFailure());
        }

        List<String> availableElementTypes = findAvailableAnimatedElementTypes();
        boolean typesAvailable = availableElementTypes.containsAll(ANIMATED_ELEMENT_TYPES);

        boolean apiEnabled = false;
        boolean generatorSupportsApi = false;
        if (workspace != null) {
            try {
                apiEnabled = workspace.getWorkspaceSettings().getMCreatorDependenciesRaw().contains(API_ID);
                String generatorName = workspace.getGeneratorConfiguration().getGeneratorName();
                debug.put("generator", generatorName);
                generatorSupportsApi = ModAPIManager.getModAPIForNameAndGenerator(API_ID, generatorName) != null;
            } catch (Exception e) {
                problems.add("Could not inspect GeckoLib API support for the current workspace: " + e.getMessage());
            }
        } else {
            problems.add("No workspace loaded.");
        }

        if (!pluginLoaded) {
            problems.add("GeckoLib Plugin is not loaded.");
            problems.add("Install Nerdy's GeckoLib Plugin compatible with MCreator 2024.4.");
            problems.add("GeckoLib creation tools are registered but unavailable until the plugin is loaded.");
        }
        if (pluginLoaded && !typesAvailable) {
            problems.add("GeckoLib Plugin is loaded, but not all animated element types are registered.");
        }
        if (pluginLoaded && workspace != null && !generatorSupportsApi) {
            problems.add("The current generator does not expose the GeckoLib API definition.");
        }
        if (pluginLoaded && workspace != null && generatorSupportsApi && !apiEnabled) {
            problems.add("GeckoLib API is not enabled in this workspace. Enable it in Workspace Settings > Required APIs, then retry.");
        }

        debug.put("expectedElementTypes", new ArrayList<>(ANIMATED_ELEMENT_TYPES));
        return new GeckoLibStatus(pluginLoaded, apiEnabled, generatorSupportsApi, typesAvailable,
                availableElementTypes, problems, debug);
    }

    public GeckoLibAssets listAssets(AssetRoots roots) {
        List<String> warnings = new ArrayList<>();
        List<String> invalidJsonFiles = new ArrayList<>();

        List<String> geoModels = scanJsonAssets(roots.modelsDir(), ".geo.json", invalidJsonFiles, warnings);
        List<String> animations = scanJsonAssets(roots.animationsDir(), ".animation.json", invalidJsonFiles, warnings);
        List<String> textures = roots.textureDirs().values().stream()
                .flatMap(path -> scanFiles(path, TEXTURE_EXTENSIONS, warnings).stream())
                .sorted()
                .toList();

        return new GeckoLibAssets(roots.workspaceModId(), roots.workspaceDir().toString(), geoModels, animations,
                textures, invalidJsonFiles, List.of(), warnings);
    }

    public AssetImportResult importAssets(AssetRoots roots, AssetImportRequest request) {
        if (request == null || request.assets() == null || request.assets().isEmpty()) {
            return new AssetImportResult(List.of(), List.of(), List.of("No assets were provided."));
        }

        List<PreparedAsset> preparedAssets = request.assets().stream()
                .map(entry -> prepareImport(roots, entry, request.overwrite()))
                .toList();

        List<Map<String, String>> skipped = preparedAssets.stream()
                .filter(PreparedAsset::skip)
                .map(asset -> Map.of("kind", asset.kind(), "targetPath", asset.target().toString(),
                        "reason", asset.skipReason()))
                .toList();

        List<PreparedAsset> assetsToCopy = preparedAssets.stream().filter(asset -> !asset.skip()).toList();
        if (assetsToCopy.isEmpty()) {
            return new AssetImportResult(List.of(), skipped, List.of());
        }

        Path stagingDir = roots.workspaceDir().resolve(".mcreator").resolve("mcp-geckolib-import-"
                + UUID.randomUUID());
        try {
            Files.createDirectories(stagingDir);
            for (PreparedAsset asset : assetsToCopy) {
                Files.createDirectories(stagingDir.resolve(asset.relativeTarget()).getParent());
                Files.copy(asset.source(), stagingDir.resolve(asset.relativeTarget()), StandardCopyOption.COPY_ATTRIBUTES);
                validateStagedFile(asset, stagingDir.resolve(asset.relativeTarget()));
            }

            for (PreparedAsset asset : assetsToCopy) {
                Path staged = stagingDir.resolve(asset.relativeTarget());
                Files.createDirectories(asset.target().getParent());
                Files.move(staged, asset.target(), StandardCopyOption.ATOMIC_MOVE);
            }

            List<Map<String, String>> imported = assetsToCopy.stream()
                    .map(asset -> Map.of("kind", asset.kind(), "targetPath", asset.target().toString()))
                    .toList();
            return new AssetImportResult(imported, skipped, List.of());
        } catch (IOException | RuntimeException e) {
            for (PreparedAsset asset : assetsToCopy) {
                if (!asset.existedBefore()) {
                    try {
                        Files.deleteIfExists(asset.target());
                    } catch (IOException ignored) {
                    }
                }
            }
            throw new IllegalStateException("Failed to import GeckoLib assets transactionally: " + e.getMessage(), e);
        } finally {
            deleteRecursively(stagingDir);
        }
    }

    public ValidationResult validateElement(Workspace workspace, String elementName) {
        if (workspace == null) {
            return new ValidationResult(false, elementName, null, List.of("No workspace loaded."), List.of());
        }
        if (elementName == null || elementName.isBlank()) {
            return new ValidationResult(false, elementName, null, List.of("Element name is required."), List.of());
        }

        ModElement element = workspace.getModElementByName(elementName.trim());
        if (element == null) {
            return new ValidationResult(false, elementName.trim(), null,
                    List.of("Element '" + elementName.trim() + "' not found."), List.of());
        }

        String elementType = element.getType().getRegistryName();
        if (!ANIMATED_ELEMENT_TYPES.contains(elementType)) {
            return new ValidationResult(false, element.getName(), elementType,
                    List.of("Element '" + element.getName() + "' is not a GeckoLib animated element."), List.of());
        }

        List<String> problems = new ArrayList<>(getStatus(workspace).problems());
        List<String> warnings = new ArrayList<>();
        GeneratableElement generatableElement = element.getGeneratableElement();
        if (generatableElement == null) {
            problems.add("Element definition could not be loaded.");
        } else {
            problems.addAll(validateKnownAssetReferences(workspace, generatableElement));
            warnings.add("Element exists, but some GeckoLib-specific fields could not be inspected safely.");
        }

        return new ValidationResult(problems.isEmpty(), element.getName(), elementType, problems, warnings);
    }

    public String createElement(MCreator mcreator, Map<String, Object> params) {
        String elementType = stringParam(params, "elementType");
        String elementName = stringParam(params, "elementName");
        if (elementType == null || elementType.isBlank()) {
            throw new IllegalArgumentException("Element type is required");
        }
        String normalizedElementType = elementType.toLowerCase(Locale.ENGLISH);
        if (!ANIMATED_ELEMENT_TYPES.contains(normalizedElementType)) {
            throw new IllegalArgumentException("Unsupported GeckoLib element type: " + normalizedElementType);
        }
        if (elementName == null || elementName.isBlank()) {
            throw new IllegalArgumentException("Element name is required");
        }
        if (!JavaConventions.isValidJavaIdentifier(elementName.trim())
                || JavaConventions.isStringReservedJavaWord(elementName.trim())) {
            throw new IllegalArgumentException("Element name must be a valid Java identifier and not a reserved word.");
        }

        Workspace workspace = mcreator == null ? null : mcreator.getWorkspace();
        if (workspace == null) {
            throw new IllegalArgumentException("No workspace loaded");
        }

        GeckoLibStatus status = getStatus(workspace);
        if (!status.pluginLoaded()) {
            throw new IllegalStateException("GeckoLib Plugin is not loaded.");
        }
        if (!status.typesAvailable()) {
            throw new IllegalStateException("GeckoLib animated element types are not available.");
        }
        if (!status.generatorSupportsApi()) {
            throw new IllegalStateException("The current generator does not support the GeckoLib API.");
        }
        if (!status.apiEnabled()) {
            throw new IllegalStateException(
                    "GeckoLib API is not enabled in this workspace. Enable it in Workspace Settings > Required APIs, then retry.");
        }

        if (workspace.getModElementByName(elementName.trim()) != null) {
            throw new IllegalArgumentException("Element with name '" + elementName.trim() + "' already exists");
        }

        ModElementType<?> type = findModElementType(normalizedElementType)
                .orElseThrow(() -> new IllegalStateException("GeckoLib element type is not registered: "
                        + normalizedElementType));
        GeneratableElement elementDefinition = instantiateStorage(workspace, elementName.trim(), type, params);
        ModElement modElement = elementDefinition.getModElement();

        runQuickEdtMutation(() -> {
            workspace.addModElement(modElement);
            workspace.getModElementManager().storeModElement(elementDefinition);
            workspace.markDirty();
            refreshWorkspaceUi(mcreator);
        });

        return "Created GeckoLib element '" + elementName.trim()
                + "'. It may still need to be opened in the MCreator editor to configure plugin-specific fields and asset references.";
    }

    public AssetRoots assetRootsForWorkspace(Workspace workspace) {
        WorkspaceFolderManager folderManager = workspace.getFolderManager();
        Map<String, Path> textureDirs = new LinkedHashMap<>();
        for (TextureType textureType : TextureType.values()) {
            try {
                java.io.File dir = folderManager.getTexturesFolder(textureType);
                if (dir != null) {
                    textureDirs.put(textureType.getID(), dir.toPath());
                }
            } catch (Exception ignored) {
            }
        }
        return new AssetRoots(workspace.getWorkspaceSettings().getModID(), folderManager.getWorkspaceFolder().toPath(),
                folderManager.getModelsDir().toPath(), folderManager.getModelAnimationsDir().toPath(), textureDirs);
    }

    private Plugin findGeckoLibPlugin() {
        try {
            if (PluginLoader.INSTANCE == null) {
                return null;
            }
            return PluginLoader.INSTANCE.getPlugins().stream()
                    .filter(plugin -> PLUGIN_ID.equals(plugin.getID()))
                    .findFirst()
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private List<String> findAvailableAnimatedElementTypes() {
        try {
            return ModElementTypeLoader.getAllModElementTypes().stream()
                    .map(ModElementType::getRegistryName)
                    .filter(ANIMATED_ELEMENT_TYPES::contains)
                    .sorted()
                    .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    private Optional<ModElementType<?>> findModElementType(String registryName) {
        try {
            return ModElementTypeLoader.getAllModElementTypes().stream()
                    .filter(type -> registryName.equals(type.getRegistryName()))
                    .findFirst();
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private List<String> scanJsonAssets(Path dir, String suffix, List<String> invalidJsonFiles, List<String> warnings) {
        List<String> files = scanFiles(dir, Set.of(suffix), warnings);
        List<String> valid = new ArrayList<>();
        for (String file : files) {
            try {
                OBJECT_MAPPER.readTree(Path.of(file).toFile());
                valid.add(file);
            } catch (Exception e) {
                invalidJsonFiles.add(file);
            }
        }
        return valid.stream().sorted().toList();
    }

    private List<String> scanFiles(Path dir, Set<String> suffixes, List<String> warnings) {
        if (dir == null || !Files.isDirectory(dir)) {
            return List.of();
        }
        try (Stream<Path> paths = Files.walk(dir)) {
            return paths.filter(Files::isRegularFile)
                    .filter(path -> suffixes.stream().anyMatch(suffix -> path.getFileName().toString().endsWith(suffix)))
                    .map(Path::toString)
                    .sorted()
                    .toList();
        } catch (IOException e) {
            warnings.add("Could not scan " + dir + ": " + e.getMessage());
            return List.of();
        }
    }

    private PreparedAsset prepareImport(AssetRoots roots, AssetImportEntry entry, boolean overwrite) {
        if (entry.sourcePath() == null || entry.sourcePath().isBlank()) {
            throw new IllegalArgumentException("Asset sourcePath is required");
        }
        Path source = Path.of(entry.sourcePath());
        if (!Files.isRegularFile(source)) {
            throw new IllegalArgumentException("Asset source file does not exist: " + entry.sourcePath());
        }

        String kind = entry.kind();
        String fileName = source.getFileName().toString();
        Path targetDir;
        if ("geo_model".equals(kind)) {
            expectSuffix(fileName, ".geo.json", "Expected .geo.json for geo_model asset");
            targetDir = roots.modelsDir();
        } else if ("animation".equals(kind)) {
            expectSuffix(fileName, ".animation.json", "Expected .animation.json for animation asset");
            targetDir = roots.animationsDir();
        } else if ("texture".equals(kind)) {
            String lower = fileName.toLowerCase(Locale.ENGLISH);
            if (TEXTURE_EXTENSIONS.stream().noneMatch(lower::endsWith)) {
                throw new IllegalArgumentException("Expected .png for texture asset: " + fileName);
            }
            String textureSubdir = normalizeTextureSubdir(entry.textureSubdir());
            targetDir = roots.textureDirs().get(textureSubdir);
            if (targetDir == null) {
                throw new IllegalArgumentException("Texture directory is not available for type: " + textureSubdir);
            }
        } else {
            throw new IllegalArgumentException("Unsupported GeckoLib asset kind: " + kind);
        }

        Path target = targetDir.resolve(fileName);
        boolean existedBefore = Files.exists(target);
        if (existedBefore && !overwrite) {
            return new PreparedAsset(kind, source, target, roots.workspaceDir().relativize(target), true,
                    "Target already exists and overwrite=false", existedBefore);
        }
        return new PreparedAsset(kind, source, target, roots.workspaceDir().relativize(target), false, "",
                existedBefore);
    }

    private void expectSuffix(String fileName, String suffix, String message) {
        if (!fileName.endsWith(suffix)) {
            throw new IllegalArgumentException(message + ": " + fileName);
        }
    }

    private String normalizeTextureSubdir(String textureSubdir) {
        if (textureSubdir == null || textureSubdir.isBlank()) {
            return "item";
        }
        if ("entities".equals(textureSubdir)) {
            return "entity";
        }
        return textureSubdir;
    }

    private void validateStagedFile(PreparedAsset asset, Path staged) throws IOException {
        if ("geo_model".equals(asset.kind()) || "animation".equals(asset.kind())) {
            OBJECT_MAPPER.readTree(staged.toFile());
        }
        if (!Files.isRegularFile(staged) || Files.size(staged) == 0) {
            throw new IOException("Staged asset is empty or missing: " + staged);
        }
    }

    private List<String> validateKnownAssetReferences(Workspace workspace, GeneratableElement element) {
        List<String> warnings = new ArrayList<>();
        AssetRoots roots = assetRootsForWorkspace(workspace);
        checkStringField(element, "normal")
                .ifPresent(model -> checkExists(warnings, roots.modelsDir().resolve(model),
                        "Missing referenced geo model: " + model));
        checkStringField(element, "model")
                .ifPresent(model -> checkExists(warnings, roots.modelsDir().resolve(model),
                        "Missing referenced geo model: " + model));
        checkStringField(element, "texture")
                .ifPresent(texture -> checkTextureExists(warnings, roots, "item", texture));
        checkStringField(element, "mobModelTexture")
                .ifPresent(texture -> checkTextureExists(warnings, roots, "entity", texture));
        return warnings;
    }

    private Optional<String> checkStringField(Object object, String fieldName) {
        try {
            Field field = object.getClass().getField(fieldName);
            Object value = field.get(object);
            if (value instanceof String string && !string.isBlank()) {
                return Optional.of(string);
            }
        } catch (Exception ignored) {
        }
        return Optional.empty();
    }

    private void checkExists(List<String> warnings, Path path, String message) {
        if (path != null && !Files.exists(path)) {
            warnings.add(message);
        }
    }

    private void checkTextureExists(List<String> warnings, AssetRoots roots, String textureType, String texture) {
        Path textureDir = roots.textureDirs().get(textureType);
        if (textureDir == null) {
            warnings.add("Could not resolve texture directory for type: " + textureType);
            return;
        }
        Path texturePath = textureDir.resolve(texture.endsWith(".png") ? texture : texture + ".png");
        if (!Files.exists(texturePath)) {
            warnings.add("Missing referenced texture: " + texture);
        }
    }

    @SuppressWarnings("unchecked")
    private GeneratableElement instantiateStorage(Workspace workspace, String elementName, ModElementType<?> type,
            Map<String, Object> params) {
        try {
            ModElement modElement = new ModElement(workspace, elementName, type);
            Class<? extends GeneratableElement> storageClass =
                    (Class<? extends GeneratableElement>) type.getModElementStorageClass();
            Constructor<? extends GeneratableElement> constructor = storageClass.getConstructor(ModElement.class);
            GeneratableElement definition = constructor.newInstance(modElement);
            applySafeDefinition(workspace, definition, params == null ? null : params.get("definition"));
            return definition;
        } catch (Exception e) {
            throw new IllegalStateException("Could not create GeckoLib element storage safely: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private void applySafeDefinition(Workspace workspace, GeneratableElement definition, Object rawDefinition)
            throws IllegalAccessException {
        if (!(rawDefinition instanceof Map<?, ?> map) || map.isEmpty()) {
            applyFallbackNames(definition);
            return;
        }

        for (Map.Entry<?, ?> entry : map.entrySet()) {
            if (!(entry.getKey() instanceof String key)) {
                continue;
            }
            Field field;
            try {
                field = definition.getClass().getField(key);
            } catch (NoSuchFieldException e) {
                throw new IllegalArgumentException("Unsupported GeckoLib definition field: " + key);
            }
            Object value = entry.getValue();
            if (field.getType() == String.class && (value == null || value instanceof String)) {
                field.set(definition, value);
            } else if ((field.getType() == int.class || field.getType() == Integer.class) && value instanceof Number number) {
                field.set(definition, number.intValue());
            } else if ((field.getType() == double.class || field.getType() == Double.class) && value instanceof Number number) {
                field.set(definition, number.doubleValue());
            } else if ((field.getType() == boolean.class || field.getType() == Boolean.class) && value instanceof Boolean) {
                field.set(definition, value);
            } else if (List.class.isAssignableFrom(field.getType()) && value instanceof List<?>) {
                field.set(definition, value);
            } else {
                throw new IllegalArgumentException("Unsupported value for GeckoLib definition field: " + key);
            }
        }
        applyFallbackNames(definition);
    }

    private void applyFallbackNames(GeneratableElement definition) {
        String readableName = definition.getModElement().getName();
        for (String fieldName : List.of("name", "mobName", "helmetName", "bodyName", "leggingsName", "bootsName")) {
            try {
                Field field = definition.getClass().getField(fieldName);
                if (field.getType() == String.class && field.get(definition) == null) {
                    field.set(definition, readableName);
                }
            } catch (Exception ignored) {
            }
        }
        for (String fieldName : List.of("normal", "model", "customModelName")) {
            try {
                Field field = definition.getClass().getField(fieldName);
                if (field.getType() == String.class && field.get(definition) == null) {
                    field.set(definition, RegistryNameFixer.fromCamelCase(readableName) + ".geo.json");
                }
            } catch (Exception ignored) {
            }
        }
    }

    private void runQuickEdtMutation(Runnable action) {
        if (SwingUtilities.isEventDispatchThread()) {
            action.run();
        } else {
            try {
                SwingUtilities.invokeAndWait(action);
            } catch (Exception e) {
                throw new IllegalStateException("Failed to mutate workspace on MCreator UI thread: " + e.getMessage(), e);
            }
        }
    }

    private void refreshWorkspaceUi(MCreator mcreator) {
        try {
            mcreator.reloadWorkspaceTabContents();
        } catch (Exception ignored) {
        }
    }

    private String stringParam(Map<String, Object> params, String key) {
        Object value = params == null ? null : params.get(key);
        return value instanceof String string ? string.trim() : null;
    }

    private void deleteRecursively(Path path) {
        if (path == null || !Files.exists(path)) {
            return;
        }
        try (Stream<Path> paths = Files.walk(path)) {
            paths.sorted(Comparator.reverseOrder()).forEach(target -> {
                try {
                    Files.deleteIfExists(target);
                } catch (IOException ignored) {
                }
            });
        } catch (IOException ignored) {
        }
    }

    public record GeckoLibStatus(boolean pluginLoaded, boolean apiEnabled, boolean generatorSupportsApi,
                                 boolean typesAvailable, List<String> availableElementTypes, List<String> problems,
                                 Map<String, Object> debug) {
    }

    public record AssetRoots(String workspaceModId, Path workspaceDir, Path modelsDir, Path animationsDir,
                             Map<String, Path> textureDirs) {
    }

    public record GeckoLibAssets(String workspaceModId, String baseAssetsDir, List<String> geoModels,
                                 List<String> animations, List<String> textures, List<String> invalidJsonFiles,
                                 List<String> orphanCandidates, List<String> warnings) {
    }

    public record AssetImportEntry(String sourcePath, String kind, String textureSubdir) {
    }

    public record AssetImportRequest(List<AssetImportEntry> assets, boolean overwrite) {
    }

    public record AssetImportResult(List<Map<String, String>> imported, List<Map<String, String>> skipped,
                                    List<String> warnings) {
    }

    public record ValidationResult(boolean valid, String elementName, String elementType, List<String> problems,
                                   List<String> warnings) {
    }

    private record PreparedAsset(String kind, Path source, Path target, Path relativeTarget, boolean skip,
                                 String skipReason, boolean existedBefore) {
    }
}
