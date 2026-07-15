package dev.nykoo.mcreatoragent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
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
import net.mcreator.element.parts.MItemBlock;
import net.mcreator.element.parts.Sound;
import net.mcreator.element.parts.procedure.LogicProcedure;
import net.mcreator.element.parts.procedure.NumberProcedure;
import net.mcreator.element.parts.procedure.Procedure;
import net.mcreator.generator.GeneratorFile;

import javax.swing.SwingUtilities;
import java.awt.Color;
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
    public static final Set<String> ANIMATED_ELEMENT_TYPES = Collections.unmodifiableSet(new LinkedHashSet<>(List.of(
            "animatedentity", "animateditem", "animatedblock", "animatedarmor")));
    public static final Map<String, String> ELEMENT_TYPE_ALIASES = Map.of(
            "geckoentity", "animatedentity",
            "geckoitem", "animateditem",
            "geckoblock", "animatedblock",
            "geckoarmor", "animatedarmor");

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Set<String> TEXTURE_EXTENSIONS = Set.of(".png");
    private static final String DEFAULT_CREATURE_AI_XML =
            "<xml xmlns=\"https://developers.google.com/blockly/xml\"><block type=\"aitasks_container\" deletable=\"false\" x=\"40\" y=\"40\"><next><block type=\"wander\"><field name=\"speed\">1</field><field name=\"condition\">null,null</field><next><block type=\"look_around\"><field name=\"condition\">null,null</field><next><block type=\"swim_in_water\"><field name=\"condition\">null,null</field></block></next></block></next></block></next></block></xml>";

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

        boolean apiEnabled = false;
        boolean generatorSupportsApi = false;
        boolean generatorSupportedTypesKnown = false;
        Set<String> generatorSupportedTypes = Set.of();
        if (workspace != null) {
            try {
                apiEnabled = workspace.getWorkspaceSettings().getMCreatorDependenciesRaw().contains(API_ID);
                String generatorName = workspace.getGeneratorConfiguration().getGeneratorName();
                debug.put("generator", generatorName);
                generatorSupportsApi = ModAPIManager.getModAPIForNameAndGenerator(API_ID, generatorName) != null;
                generatorSupportedTypes = workspace.getGeneratorStats().getSupportedModElementTypes().stream()
                        .map(ModElementType::getRegistryName)
                        .collect(Collectors.toSet());
                generatorSupportedTypesKnown = true;
            } catch (Exception e) {
                problems.add("Could not inspect GeckoLib API support for the current workspace: " + e.getMessage());
            }
        } else {
            problems.add("No workspace loaded.");
        }

        TypeAvailability availability = evaluateTypeAvailability(findRegisteredElementTypes(), generatorSupportedTypes,
                pluginLoaded, apiEnabled, generatorSupportsApi);
        Set<String> canonicalGeneratorSupported = canonicalRegistrationsFrom(generatorSupportedTypes);
        boolean generatorListsAnyAnimated = ANIMATED_ELEMENT_TYPES.stream()
                .anyMatch(canonicalGeneratorSupported::contains);

        if (!pluginLoaded) {
            problems.add("GeckoLib Plugin is not loaded.");
            problems.add("Install Nerdy's GeckoLib Plugin compatible with MCreator 2024.4.");
            problems.add("GeckoLib creation tools are registered but unavailable until the plugin is loaded.");
        }
        if (pluginLoaded && !availability.registeredElementTypes().containsAll(ANIMATED_ELEMENT_TYPES)) {
            List<String> missing = ANIMATED_ELEMENT_TYPES.stream()
                    .filter(type -> !availability.registeredElementTypes().contains(type))
                    .toList();
            problems.add("GeckoLib Plugin is loaded, but these canonical animated element types are not registered: "
                    + missing);
        }
        if (pluginLoaded && workspace != null && !generatorSupportsApi) {
            problems.add("The current generator does not expose the GeckoLib API definition.");
        }
        if (pluginLoaded && workspace != null && generatorSupportedTypesKnown) {
            if (generatorListsAnyAnimated) {
                List<String> unsupportedByGenerator = availability.registeredElementTypes().stream()
                        .filter(type -> !canonicalGeneratorSupported.contains(type))
                        .toList();
                if (!unsupportedByGenerator.isEmpty()) {
                    problems.add("These registered GeckoLib element types are not supported by the current generator: "
                            + unsupportedByGenerator);
                }
            } else if (!availability.registeredElementTypes().isEmpty() && availability.anyTypeCreatable()) {
                debug.put("creatableUsedGeneratorFallback", true);
            }
        }
        if (pluginLoaded && workspace != null && generatorSupportsApi && !apiEnabled) {
            problems.add("GeckoLib API is not enabled in this workspace. Enable it in Workspace Settings > Required APIs, then retry.");
        }

        debug.put("expectedElementTypes", new ArrayList<>(ANIMATED_ELEMENT_TYPES));
        debug.put("generatorSupportedElementTypes", canonicalGeneratorSupported.stream().sorted().toList());
        debug.put("generatorSupportedElementTypesKnown", generatorSupportedTypesKnown);
        debug.put("generatorListsAnyAnimatedType", generatorListsAnyAnimated);
        return new GeckoLibStatus(pluginLoaded, apiEnabled, generatorSupportsApi, availability.typesAvailable(),
                availability.registeredElementTypes(), problems, debug, availability.registeredElementTypes(),
                availability.creatableElementTypes(), availability.elementTypeAliases(),
                availability.anyTypeCreatable(), availability.allTypesCreatable());
    }

    public GeckoLibAssets listAssets(AssetRoots roots) {
        List<String> warnings = new ArrayList<>();
        List<String> invalidJsonFiles = new ArrayList<>();

        List<String> geoModels = mergeUniquePaths(
                scanJsonAssets(roots.modelsDir(), ".geo.json", invalidJsonFiles, warnings),
                scanJsonAssets(roots.runtimeGeoDir(), ".geo.json", invalidJsonFiles, warnings));
        List<String> animations = mergeUniquePaths(
                scanJsonAssets(roots.animationsDir(), ".animation.json", invalidJsonFiles, warnings),
                scanJsonAssets(roots.runtimeAnimationsDir(), ".animation.json", invalidJsonFiles, warnings));
        List<String> textures = roots.textureDirs().values().stream()
                .flatMap(path -> scanFiles(path, TEXTURE_EXTENSIONS, warnings).stream())
                .map(this::normalizePathKey)
                .distinct()
                .sorted()
                .toList();

        return new GeckoLibAssets(roots.workspaceModId(), roots.workspaceDir().toString(), geoModels, animations,
                textures, invalidJsonFiles.stream().map(this::normalizePathKey).distinct().sorted().toList(),
                List.of(), warnings);
    }

    public AssetImportResult importAssets(AssetRoots roots, AssetImportRequest request) {
        if (request == null || request.assets() == null || request.assets().isEmpty()) {
            return new AssetImportResult(List.of(), List.of(), List.of("No assets were provided."));
        }

        List<PreparedAsset> preparedAssets = request.assets().stream()
                .flatMap(entry -> prepareImport(roots, entry, request.overwrite()).stream())
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
                Path staged = stagingDir.resolve(asset.relativeTarget());
                Files.createDirectories(staged.getParent());
                Files.copy(asset.source(), staged, StandardCopyOption.COPY_ATTRIBUTES);
                validateStagedFile(asset, staged);
            }

            for (PreparedAsset asset : assetsToCopy) {
                Path staged = stagingDir.resolve(asset.relativeTarget());
                Files.createDirectories(asset.target().getParent());
                try {
                    Files.move(staged, asset.target(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
                } catch (AtomicMoveNotSupportedException e) {
                    Files.move(staged, asset.target(), StandardCopyOption.REPLACE_EXISTING);
                }
            }

            List<Map<String, String>> imported = assetsToCopy.stream()
                    .map(asset -> {
                        Map<String, String> row = new LinkedHashMap<>();
                        row.put("kind", asset.kind());
                        row.put("targetPath", asset.target().toString());
                        if (asset.location() != null && !asset.location().isBlank()) {
                            row.put("location", asset.location());
                        }
                        return row;
                    })
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

        List<String> problems = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        // Plugin/API status issues are warnings unless the element type itself cannot load.
        warnings.addAll(getStatus(workspace).problems());
        GeneratableElement generatableElement = element.getGeneratableElement();
        if (generatableElement == null) {
            problems.add("Element definition could not be loaded.");
        } else {
            problems.addAll(validateKnownAssetReferences(workspace, generatableElement));
            CompanionCheck companions = validateGeneratedCompanions(workspace, element);
            problems.addAll(companions.problems());
            warnings.addAll(companions.warnings());
            if (Boolean.TRUE.equals(readBooleanField(generatableElement, "headMovement"))) {
                warnings.add("headMovement=true: verify generated/locked model rotates the correct bone name(s); "
                        + "sibling bones of head (nose/headwear) may not follow automatically.");
            }
        }

        return new ValidationResult(problems.isEmpty(), element.getName(), elementType, problems, warnings);
    }

    public CreateElementResult createElement(MCreator mcreator, Map<String, Object> params) {
        String elementType = stringParam(params, "elementType");
        String elementName = stringParam(params, "elementName");
        if (elementType == null || elementType.isBlank()) {
            throw new IllegalArgumentException("Element type is required");
        }
        String normalizedElementType = normalizeElementType(elementType);
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
        if (!status.generatorSupportsApi()) {
            throw new IllegalStateException("The current generator does not support the GeckoLib API.");
        }
        if (!status.apiEnabled()) {
            throw new IllegalStateException(
                    "GeckoLib API is not enabled in this workspace. Enable it in Workspace Settings > Required APIs, then retry.");
        }
        if (!isElementTypeCreatable(status.creatableElementTypes(), normalizedElementType)) {
            throw new IllegalStateException("GeckoLib element type is not creatable in the current workspace: "
                    + normalizedElementType);
        }

        if (workspace.getModElementByName(elementName.trim()) != null) {
            throw new IllegalArgumentException("Element with name '" + elementName.trim() + "' already exists");
        }

        ModElementType<?> type = findModElementType(normalizedElementType)
                .orElseThrow(() -> new IllegalStateException("GeckoLib element type is not registered: "
                        + normalizedElementType));
        InstantiatedStorage storage = instantiateStorage(workspace, elementName.trim(), type, params);
        ModElement modElement = storage.definition().getModElement();

        runQuickEdtMutation(() -> {
            workspace.addModElement(modElement);
            workspace.getModElementManager().storeModElement(storage.definition());
            workspace.markDirty();
            refreshWorkspaceUi(mcreator);
        });
        String saveWarning = null;
        try {
            workspace.getFileManager().saveWorkspaceDirectlyAndWait();
        } catch (Exception e) {
            saveWarning = "Workspace force-save failed; persistence postconditions may be unknown: " + e.getMessage();
        }

        String recognizedInMemory = inspectInMemoryElement(workspace, elementName.trim(), normalizedElementType);
        String definitionStored = inspectDefinitionStored(workspace, elementName.trim());
        String definitionLoadable = inspectDefinitionLoadable(workspace, elementName.trim());
        String workspaceEntryStored = inspectWorkspaceEntryStored(workspace, elementName.trim(), normalizedElementType);
        CreationConfirmation confirmation = evaluateCreationConfirmation(recognizedInMemory,
                definitionStored, definitionLoadable, workspaceEntryStored);

        List<String> generatedFiles = List.of();
        List<String> warnings = new ArrayList<>(storage.warnings());
        warnings.addAll(storage.skippedFields());
        if (saveWarning != null) {
            warnings.add(saveWarning);
        }
        warnings.addAll(confirmation.warnings());
        if (!confirmation.confirmed()) {
            warnings.add("Do not regenerate code until the failed or unknown creation postconditions are reconciled.");
        }

        // Default generateCode=true for animated types so MCP creates a usable MCreator base without a second call.
        boolean generateCode = params == null || !params.containsKey("generateCode")
                || booleanParam(params, "generateCode", true);
        List<String> problems = new ArrayList<>(confirmation.problems());
        if (generateCode && confirmation.confirmed()) {
            GenerateElementResult generateResult = generateModElement(mcreator, elementName.trim(), true, true);
            generatedFiles = generateResult.generatedFiles();
            warnings.addAll(generateResult.warnings());
            if (!"completed".equals(generateResult.status())) {
                problems.add("createGeckoLibElement generateCode did not complete: " + generateResult.message());
            } else {
                ValidationResult post = validateElement(workspace, elementName.trim());
                problems.addAll(post.problems());
                warnings.addAll(post.warnings());
            }
        } else if (!generateCode) {
            warnings.add("generateCode=false: element scaffold only. Call generateModElement for Java/registries.");
        } else if (generateCode) {
            warnings.add("generateCode was requested but skipped because creation postconditions are not confirmed.");
        }

        String message = confirmation.confirmed()
                ? (generatedFiles.isEmpty()
                        ? "Created and confirmed GeckoLib element '" + elementName.trim()
                                + "'. Code is not generated yet; call generateModElement or pass generateCode=true."
                        : "Created, confirmed, and generated GeckoLib element '" + elementName.trim() + "'.")
                : "Created GeckoLib element '" + elementName.trim()
                        + "', but persistence and recognition are not fully confirmed.";
        return new CreateElementResult(message, storage.appliedDefaults(), storage.validationWarnings(),
                confirmation.confirmed() && problems.isEmpty(), elementName.trim(), normalizedElementType,
                modElement.getRegistryName(), recognizedInMemory, definitionStored, definitionLoadable,
                workspaceEntryStored, problems, warnings, storage.appliedFields(), storage.skippedFields(),
                generatedFiles);
    }

    public CreateElementResult updateElement(MCreator mcreator, Map<String, Object> params) {
        String elementName = stringParam(params, "elementName");
        if (elementName == null || elementName.isBlank()) {
            throw new IllegalArgumentException("Element name is required");
        }
        Workspace workspace = mcreator == null ? null : mcreator.getWorkspace();
        if (workspace == null) {
            throw new IllegalArgumentException("No workspace loaded");
        }
        ModElement modElement = workspace.getModElementByName(elementName.trim());
        if (modElement == null) {
            throw new IllegalArgumentException("Element '" + elementName.trim() + "' not found");
        }
        String elementType = modElement.getType().getRegistryName();
        if (!ANIMATED_ELEMENT_TYPES.contains(elementType)) {
            throw new IllegalArgumentException("Element '" + elementName.trim() + "' is not a GeckoLib animated element");
        }
        GeneratableElement definition = modElement.getGeneratableElement();
        if (definition == null) {
            throw new IllegalStateException("Element definition could not be loaded for '" + elementName.trim() + "'");
        }

        DefinitionApplyResult applyResult = applySafeDefinition(workspace, definition,
                params == null ? null : params.get("definition"), booleanParam(params, "strict", false));
        List<String> validationWarnings = validateDefinitionForGeneration(definition);

        runQuickEdtMutation(() -> {
            workspace.getModElementManager().storeModElement(definition);
            workspace.markDirty();
            refreshWorkspaceUi(mcreator);
        });
        String saveWarning = null;
        try {
            workspace.getFileManager().saveWorkspaceDirectlyAndWait();
        } catch (Exception e) {
            saveWarning = "Workspace force-save failed; persistence postconditions may be unknown: " + e.getMessage();
        }

        String recognizedInMemory = inspectInMemoryElement(workspace, elementName.trim(), elementType);
        String definitionStored = inspectDefinitionStored(workspace, elementName.trim());
        String definitionLoadable = inspectDefinitionLoadable(workspace, elementName.trim());
        String workspaceEntryStored = inspectWorkspaceEntryStored(workspace, elementName.trim(), elementType);
        CreationConfirmation confirmation = evaluateCreationConfirmation(recognizedInMemory,
                definitionStored, definitionLoadable, workspaceEntryStored);

        List<String> warnings = new ArrayList<>(applyResult.skippedFields());
        warnings.addAll(validationWarnings);
        if (saveWarning != null) {
            warnings.add(saveWarning);
        }
        warnings.addAll(confirmation.warnings());
        return new CreateElementResult(
                confirmation.confirmed()
                        ? "Updated GeckoLib element '" + elementName.trim() + "'."
                        : "Updated GeckoLib element '" + elementName.trim() + "', but postconditions are incomplete.",
                List.of(), validationWarnings, confirmation.confirmed(), elementName.trim(), elementType,
                modElement.getRegistryName(), recognizedInMemory, definitionStored, definitionLoadable,
                workspaceEntryStored, confirmation.problems(), warnings, applyResult.appliedFields(),
                applyResult.skippedFields(), List.of());
    }

    public GenerateElementResult generateModElement(MCreator mcreator, String elementName, boolean generateBase,
            boolean protectGradle) {
        if (elementName == null || elementName.isBlank()) {
            throw new IllegalArgumentException("Element name is required");
        }
        Workspace workspace = mcreator == null ? null : mcreator.getWorkspace();
        if (workspace == null) {
            throw new IllegalArgumentException("No workspace loaded");
        }
        ModElement modElement = workspace.getModElementByName(elementName.trim());
        if (modElement == null) {
            throw new IllegalArgumentException("Element '" + elementName.trim() + "' not found");
        }
        GeneratableElement definition = modElement.getGeneratableElement();
        if (definition == null) {
            throw new IllegalStateException("Element definition could not be loaded for '" + elementName.trim() + "'");
        }
        if (modElement.isCodeLocked()) {
            return new GenerateElementResult("skipped_locked", elementName.trim(), List.of(), List.of(), List.of(),
                    List.of(), List.of("Element code is locked; generation skipped."), "Element is code-locked.",
                    false, false);
        }
        if (workspace.getGenerator() == null) {
            throw new IllegalStateException("Workspace generator is not available");
        }

        Path workspaceDir = workspace.getWorkspaceFolder().toPath();
        WorkspaceMutationGuard.WorkspaceSnapshot snapshot = null;
        List<String> warnings = new ArrayList<>();
        try {
            snapshot = WorkspaceMutationGuard.snapshot(workspaceDir,
                    WorkspaceMutationGuard.DEFAULT_PROTECT_RELATIVE_PATHS);
        } catch (Exception e) {
            warnings.add("Could not snapshot workspace before generation: " + e.getMessage());
        }

        List<String> generatedFiles = new ArrayList<>();
        boolean baseGenerated = false;
        try {
            List<GeneratorFile> files = workspace.getGenerator().generateElement(definition, true);
            for (GeneratorFile file : files) {
                if (file != null && file.getFile() != null) {
                    generatedFiles.add(workspace.getFolderManager().getPathInWorkspace(file.getFile())
                            .replace('\\', '/'));
                }
            }
            if (generateBase) {
                workspace.getGenerator().generateBase(true);
                baseGenerated = true;
            }
            // Match MCreator UI save/regenerate side-effects for a single mod element.
            try {
                workspace.getModElementManager().storeModElementPicture(definition);
            } catch (Exception e) {
                warnings.add("storeModElementPicture failed: " + e.getMessage());
            }
            try {
                definition.getModElement().reinit(workspace);
            } catch (Exception e) {
                warnings.add("modElement.reinit failed: " + e.getMessage());
            }
            try {
                definition.getModElement().getMCItems().forEach(mcItem -> {
                    try {
                        mcItem.icon.getImage().flush();
                    } catch (Exception ignored) {
                    }
                });
            } catch (Exception ignored) {
            }
            workspace.getModElementManager().storeModElement(definition);
            try {
                workspace.getFileManager().saveWorkspaceDirectlyAndWait();
            } catch (Exception e) {
                warnings.add("Workspace force-save after generate failed: " + e.getMessage());
            }
            runQuickEdtMutation(() -> refreshWorkspaceUi(mcreator));
        } catch (Exception e) {
            return new GenerateElementResult("failed", elementName.trim(), generatedFiles, List.of(), List.of(),
                    List.of(), warnings, "Generation failed: " + e.getMessage(), baseGenerated, false);
        }

        List<String> restored = List.of();
        List<String> deleted = List.of();
        List<String> modified = List.of();
        boolean gradleRestored = false;
        if (snapshot != null) {
            try {
                WorkspaceMutationGuard.MutationReport report = WorkspaceMutationGuard.diffAndProtect(workspaceDir,
                        snapshot, WorkspaceMutationGuard.DEFAULT_PROTECT_RELATIVE_PATHS, protectGradle);
                restored = report.restoredProtectedFiles();
                deleted = report.deletedFiles();
                modified = report.modifiedFiles();
                warnings.addAll(report.warnings());
                gradleRestored = restored.stream().anyMatch(p -> p.replace('\\', '/').endsWith("mcreator.gradle")
                        || p.replace('\\', '/').endsWith("build.gradle"));
                if (gradleRestored) {
                    warnings.add("gradleRestored=true: protected gradle file(s) were restored after generateBase.");
                }
            } catch (Exception e) {
                warnings.add("Post-generation mutation report failed: " + e.getMessage());
            }
        }

        List<String> metadataFiles = readMetadataFiles(modElement);
        if (generatedFiles.isEmpty() && !metadataFiles.isEmpty()) {
            generatedFiles = new ArrayList<>(metadataFiles);
        }

        return new GenerateElementResult("completed", elementName.trim(), generatedFiles, deleted, modified,
                metadataFiles, warnings, "Generated mod element '" + elementName.trim() + "'.", baseGenerated,
                gradleRestored);
    }

    private List<String> readMetadataFiles(ModElement modElement) {
        Object filesMeta = modElement.getMetadata("files");
        if (!(filesMeta instanceof List<?> fileList) || fileList.isEmpty()) {
            return List.of();
        }
        List<String> out = new ArrayList<>();
        for (Object entry : fileList) {
            if (entry instanceof String relative && !relative.isBlank()) {
                out.add(relative.replace('\\', '/'));
            }
        }
        return out;
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
        String modId = workspace.getWorkspaceSettings().getModID();
        Path workspaceDir = folderManager.getWorkspaceFolder().toPath();
        Path runtimeAssets = workspaceDir.resolve("src").resolve("main").resolve("resources")
                .resolve("assets").resolve(modId);
        return new AssetRoots(modId, workspaceDir,
                folderManager.getModelsDir().toPath(), folderManager.getModelAnimationsDir().toPath(),
                runtimeAssets.resolve("geo"), runtimeAssets.resolve("animations"), textureDirs);
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

    private Set<String> findRegisteredElementTypes() {
        try {
            return ModElementTypeLoader.getAllModElementTypes().stream()
                    .map(ModElementType::getRegistryName)
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            return Set.of();
        }
    }

    static TypeAvailability evaluateTypeAvailability(Set<String> registeredTypes, Set<String> generatorSupportedTypes,
            boolean pluginLoaded, boolean apiEnabled, boolean generatorSupportsApi) {
        Set<String> canonicalRegistered = canonicalRegistrationsFrom(registeredTypes);
        Set<String> canonicalGeneratorSupported = canonicalRegistrationsFrom(generatorSupportedTypes);
        List<String> registered = ANIMATED_ELEMENT_TYPES.stream().filter(canonicalRegistered::contains).sorted().toList();
        boolean workspaceReady = pluginLoaded && apiEnabled && generatorSupportsApi;
        boolean generatorListsAnyAnimated = ANIMATED_ELEMENT_TYPES.stream()
                .anyMatch(canonicalGeneratorSupported::contains);
        List<String> creatable;
        if (!workspaceReady) {
            creatable = List.of();
        } else if (generatorListsAnyAnimated) {
            creatable = ANIMATED_ELEMENT_TYPES.stream()
                    .filter(canonicalRegistered::contains)
                    .filter(canonicalGeneratorSupported::contains)
                    .sorted()
                    .toList();
        } else {
            // Generator stats sometimes omit plugin-provided types even when they are creatable in UI.
            creatable = registered;
        }
        // typesAvailable = all four canonical types are registered (legacy full-plugin signal)
        return new TypeAvailability(registered.containsAll(ANIMATED_ELEMENT_TYPES), !creatable.isEmpty(),
                creatable.containsAll(ANIMATED_ELEMENT_TYPES), registered, creatable, ELEMENT_TYPE_ALIASES);
    }

    static boolean isElementTypeCreatable(Collection<String> creatableElementTypes, String elementType) {
        return creatableElementTypes != null && creatableElementTypes.contains(normalizeElementType(elementType));
    }

    static CreationConfirmation evaluateCreationConfirmation(String recognizedInMemory, String definitionStored,
            String definitionLoadable, String workspaceEntryStored) {
        Map<String, String> checks = new LinkedHashMap<>();
        checks.put("recognizedInMemory", normalizeCheckStatus(recognizedInMemory));
        checks.put("definitionStored", normalizeCheckStatus(definitionStored));
        checks.put("definitionLoadable", normalizeCheckStatus(definitionLoadable));
        checks.put("workspaceEntryStored", normalizeCheckStatus(workspaceEntryStored));

        List<String> problems = checks.entrySet().stream()
                .filter(entry -> "fail".equals(entry.getValue()))
                .map(entry -> "Creation postcondition failed: " + entry.getKey())
                .toList();
        List<String> warnings = checks.entrySet().stream()
                .filter(entry -> "unknown".equals(entry.getValue()))
                .map(entry -> "Creation postcondition is unknown: " + entry.getKey())
                .toList();
        boolean confirmed = checks.values().stream().allMatch("pass"::equals);
        return new CreationConfirmation(confirmed, problems, warnings);
    }

    private static Set<String> canonicalRegistrationsFrom(Collection<String> types) {
        if (types == null) {
            return Set.of();
        }
        return types.stream().filter(Objects::nonNull).map(type -> type.trim().toLowerCase(Locale.ENGLISH))
                .filter(ANIMATED_ELEMENT_TYPES::contains).collect(Collectors.toSet());
    }

    static String normalizeElementType(String elementType) {
        String normalized = elementType == null ? "" : elementType.trim().toLowerCase(Locale.ENGLISH);
        return ELEMENT_TYPE_ALIASES.getOrDefault(normalized, normalized);
    }

    private static String normalizeCheckStatus(String status) {
        return Set.of("pass", "fail", "unknown").contains(status) ? status : "unknown";
    }

    private String inspectInMemoryElement(Workspace workspace, String elementName, String elementType) {
        try {
            ModElement element = workspace.getModElementByName(elementName);
            return element != null && elementType.equals(element.getType().getRegistryName()) ? "pass" : "fail";
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String inspectDefinitionStored(Workspace workspace, String elementName) {
        try {
            Path definition = workspace.getFolderManager().getModElementsDir().toPath()
                    .resolve(elementName + ".mod.json");
            return Files.isRegularFile(definition) ? "pass" : "fail";
        } catch (Exception e) {
            return "unknown";
        }
    }

    private String inspectDefinitionLoadable(Workspace workspace, String elementName) {
        try {
            Path definition = workspace.getFolderManager().getModElementsDir().toPath()
                    .resolve(elementName + ".mod.json");
            ModElement element = workspace.getModElementByName(elementName);
            if (element == null) {
                return "fail";
            }
            String json = Files.readString(definition);
            return workspace.getModElementManager().fromJSONtoGeneratableElement(json, element) != null
                    ? "pass"
                    : "fail";
        } catch (Exception e) {
            return Files.exists(workspace.getFolderManager().getModElementsDir().toPath()
                    .resolve(elementName + ".mod.json")) ? "fail" : "unknown";
        }
    }

    private String inspectWorkspaceEntryStored(Workspace workspace, String elementName, String elementType) {
        try {
            JsonNode root = OBJECT_MAPPER.readTree(workspace.getFileManager().getWorkspaceFile());
            JsonNode elements = root.get("mod_elements");
            if (elements == null || !elements.isArray()) {
                return "unknown";
            }
            for (JsonNode element : elements) {
                if (elementName.equals(element.path("name").asText())
                        && elementType.equals(element.path("type").asText())) {
                    return "pass";
                }
            }
            return "fail";
        } catch (Exception e) {
            return "unknown";
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

    private List<PreparedAsset> prepareImport(AssetRoots roots, AssetImportEntry entry, boolean overwrite) {
        if (entry.sourcePath() == null || entry.sourcePath().isBlank()) {
            throw new IllegalArgumentException("Asset sourcePath is required");
        }
        Path source = Path.of(entry.sourcePath());
        if (!Files.isRegularFile(source)) {
            throw new IllegalArgumentException("Asset source file does not exist: " + entry.sourcePath());
        }

        String kind = entry.kind();
        if ("geo".equals(kind)) {
            kind = "geo_model";
        }
        String fileName = entry.targetName() != null && !entry.targetName().isBlank()
                ? entry.targetName()
                : source.getFileName().toString();

        List<TargetSpec> targets = new ArrayList<>();
        if ("geo_model".equals(kind)) {
            expectSuffix(fileName, ".geo.json", "Expected .geo.json for geo_model asset");
            targets.add(new TargetSpec(roots.modelsDir().resolve(fileName), "authoring"));
            targets.add(new TargetSpec(roots.runtimeGeoDir().resolve(fileName), "runtime"));
        } else if ("animation".equals(kind)) {
            expectSuffix(fileName, ".animation.json", "Expected .animation.json for animation asset");
            targets.add(new TargetSpec(roots.animationsDir().resolve(fileName), "authoring"));
            targets.add(new TargetSpec(roots.runtimeAnimationsDir().resolve(fileName), "runtime"));
        } else if ("texture".equals(kind)) {
            String lower = fileName.toLowerCase(Locale.ENGLISH);
            if (TEXTURE_EXTENSIONS.stream().noneMatch(lower::endsWith)) {
                throw new IllegalArgumentException("Expected .png for texture asset: " + fileName);
            }
            String textureSubdir = normalizeTextureSubdir(entry.textureSubdir());
            Path targetDir = roots.textureDirs().get(textureSubdir);
            if (targetDir == null) {
                throw new IllegalArgumentException("Texture directory is not available for type: " + textureSubdir);
            }
            targets.add(new TargetSpec(targetDir.resolve(fileName), "texture"));
        } else {
            throw new IllegalArgumentException("Unsupported GeckoLib asset kind: " + kind);
        }

        List<PreparedAsset> prepared = new ArrayList<>();
        for (TargetSpec targetSpec : targets) {
            Path target = targetSpec.path();
            Path relative = relativizeSafe(roots.workspaceDir(), target);
            boolean existedBefore = Files.exists(target);
            if (existedBefore && !overwrite) {
                prepared.add(new PreparedAsset(kind, source, target, relative, true,
                        "Target already exists and overwrite=false", existedBefore, targetSpec.location()));
            } else {
                prepared.add(new PreparedAsset(kind, source, target, relative, false, "", existedBefore,
                        targetSpec.location()));
            }
        }
        return prepared;
    }

    private Path relativizeSafe(Path workspaceDir, Path target) {
        try {
            return workspaceDir.relativize(target);
        } catch (IllegalArgumentException e) {
            // Different roots (rare on Windows); fall back to a unique staging key.
            return Path.of("external").resolve(Integer.toHexString(target.toString().hashCode()))
                    .resolve(target.getFileName());
        }
    }

    private List<String> mergeUniquePaths(List<String> first, List<String> second) {
        LinkedHashSet<String> merged = new LinkedHashSet<>();
        if (first != null) {
            first.stream().map(this::normalizePathKey).forEach(merged::add);
        }
        if (second != null) {
            second.stream().map(this::normalizePathKey).forEach(merged::add);
        }
        return merged.stream().sorted().toList();
    }

    private String normalizePathKey(String path) {
        if (path == null) {
            return "";
        }
        return Path.of(path).normalize().toString().replace('\\', '/');
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
        List<String> problems = new ArrayList<>();
        AssetRoots roots = assetRootsForWorkspace(workspace);
        checkStringField(element, "normal")
                .ifPresent(model -> checkGeoExists(problems, roots, model));
        checkStringField(element, "model")
                .ifPresent(model -> checkGeoExists(problems, roots, model));
        checkStringField(element, "texture")
                .ifPresent(texture -> checkTextureExists(problems, roots, "item", texture));
        checkStringField(element, "mobModelTexture")
                .ifPresent(texture -> checkTextureExists(problems, roots, "entity", texture));
        // animation companion files use the geo basename when present
        checkStringField(element, "model").ifPresent(model -> {
            String base = model.endsWith(".geo.json") ? model.substring(0, model.length() - ".geo.json".length()) : model;
            Path authoring = roots.animationsDir().resolve(base + ".animation.json");
            Path runtime = roots.runtimeAnimationsDir().resolve(base + ".animation.json");
            if (!Files.exists(authoring) && !Files.exists(runtime)) {
                problems.add("MISSING_ANIMATION: companion for model '" + model + "' (expected " + base
                        + ".animation.json under models/animations or assets animations).");
            }
        });
        return problems;
    }

    private CompanionCheck validateGeneratedCompanions(Workspace workspace, ModElement element) {
        List<String> problems = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        Object filesMeta = element.getMetadata("files");
        if (!(filesMeta instanceof List<?> fileList) || fileList.isEmpty()) {
            warnings.add("NO_METADATA_FILES: no generated metadata.files yet; call generateModElement or create with generateCode=true.");
            return new CompanionCheck(problems, warnings);
        }
        Path root = workspace.getWorkspaceFolder().toPath();
        for (Object entry : fileList) {
            if (!(entry instanceof String relative) || relative.isBlank()) {
                continue;
            }
            Path path = root.resolve(relative.replace('/', java.io.File.separatorChar));
            if (!Files.isRegularFile(path)) {
                problems.add("MISSING_JAVA_OR_RESOURCE: metadata.files entry missing on disk: " + relative);
            }
        }
        return new CompanionCheck(problems, warnings);
    }

    private record CompanionCheck(List<String> problems, List<String> warnings) {
    }

    private Boolean readBooleanField(Object target, String fieldName) {
        try {
            Field field = findAccessibleField(target.getClass(), fieldName);
            Object value = field.get(target);
            return value instanceof Boolean bool ? bool : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static boolean booleanParam(Map<String, Object> params, String key, boolean defaultValue) {
        if (params == null || !params.containsKey(key)) {
            return defaultValue;
        }
        Object value = params.get(key);
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value instanceof String string) {
            return Boolean.parseBoolean(string);
        }
        return defaultValue;
    }

    private void checkGeoExists(List<String> problems, AssetRoots roots, String model) {
        if (model == null || model.isBlank()) {
            return;
        }
        Path authoring = roots.modelsDir().resolve(model);
        Path runtime = roots.runtimeGeoDir().resolve(model);
        if (!Files.exists(authoring) && !Files.exists(runtime)) {
            problems.add("MISSING_GEO: referenced geo model: " + model
                    + " (checked models/ and assets/" + roots.workspaceModId() + "/geo/)");
        }
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

    private void checkTextureExists(List<String> problems, AssetRoots roots, String textureType, String texture) {
        Path textureDir = roots.textureDirs().get(textureType);
        if (textureDir == null) {
            problems.add("MISSING_TEXTURE_DIR: could not resolve texture directory for type: " + textureType);
            return;
        }
        Path texturePath = textureDir.resolve(texture.endsWith(".png") ? texture : texture + ".png");
        if (!Files.exists(texturePath)) {
            problems.add("MISSING_TEXTURE: referenced texture: " + texture);
        }
    }

    @SuppressWarnings("unchecked")
    private InstantiatedStorage instantiateStorage(Workspace workspace, String elementName, ModElementType<?> type,
            Map<String, Object> params) {
        try {
            ModElement modElement = new ModElement(workspace, elementName, type);
            Class<? extends GeneratableElement> storageClass =
                    (Class<? extends GeneratableElement>) type.getModElementStorageClass();
            Constructor<? extends GeneratableElement> constructor = storageClass.getConstructor(ModElement.class);
            GeneratableElement definition = constructor.newInstance(modElement);
            List<String> appliedDefaults = applyKnownSafeDefaults(workspace, definition);
            appliedDefaults.addAll(applyAnimatedEntitySensibleDefaults(workspace, definition, type.getRegistryName()));
            DefinitionApplyResult applyResult = applySafeDefinition(workspace, definition,
                    params == null ? null : params.get("definition"), booleanParam(params, "strict", false));
            List<String> validationWarnings = validateDefinitionForGeneration(definition);

            return new InstantiatedStorage(definition, appliedDefaults, validationWarnings,
                    applyResult.appliedFields(), applyResult.skippedFields());
        } catch (Exception e) {
            throw new IllegalStateException("Could not create GeckoLib element storage safely: " + e.getMessage(), e);
        }
    }

    private DefinitionApplyResult applySafeDefinition(Workspace workspace, GeneratableElement definition,
            Object rawDefinition, boolean strict) {
        List<String> applied = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        if (!(rawDefinition instanceof Map<?, ?> map) || map.isEmpty()) {
            applyFallbackNames(definition);
            return new DefinitionApplyResult(applied, skipped);
        }

        for (Map.Entry<?, ?> entry : map.entrySet()) {
            if (!(entry.getKey() instanceof String key)) {
                continue;
            }
            Field field;
            try {
                field = findAccessibleField(definition.getClass(), key);
            } catch (NoSuchFieldException e) {
                String message = "Unsupported GeckoLib definition field: " + key;
                if (strict) {
                    throw new IllegalArgumentException(message);
                }
                skipped.add(message);
                continue;
            }
            try {
                Object converted = convertDefinitionValue(workspace, field, entry.getValue());
                field.setAccessible(true);
                field.set(definition, converted);
                applied.add(key);
            } catch (IllegalArgumentException ex) {
                if (strict) {
                    throw ex;
                }
                skipped.add("Skipped definition field '" + key + "': " + ex.getMessage());
            } catch (Exception ex) {
                if (strict) {
                    throw new IllegalArgumentException("Failed to apply GeckoLib definition field: " + key, ex);
                }
                skipped.add("Skipped definition field '" + key + "': " + ex.getMessage());
            }
        }
        applyFallbackNames(definition);
        return new DefinitionApplyResult(applied, skipped);
    }

    private Object convertDefinitionValue(Workspace workspace, Field field, Object value) {
        Class<?> type = field.getType();
        if (value == null) {
            if (type.isPrimitive()) {
                throw new IllegalArgumentException("null is not valid for primitive field type " + type.getName());
            }
            return null;
        }
        if (type == String.class && value instanceof String) {
            return value;
        }
        if ((type == int.class || type == Integer.class) && value instanceof Number number) {
            return number.intValue();
        }
        if ((type == double.class || type == Double.class) && value instanceof Number number) {
            return number.doubleValue();
        }
        if ((type == float.class || type == Float.class) && value instanceof Number number) {
            return number.floatValue();
        }
        if ((type == boolean.class || type == Boolean.class) && value instanceof Boolean) {
            return value;
        }
        if (List.class.isAssignableFrom(type) && value instanceof List<?>) {
            return value;
        }
        if (type == Color.class) {
            return convertColor(value);
        }
        if (type == Sound.class) {
            return convertSound(workspace, value);
        }
        if (type == MItemBlock.class) {
            return convertMItemBlock(workspace, value);
        }
        if (type == NumberProcedure.class) {
            return convertNumberProcedure(value);
        }
        if (type == LogicProcedure.class) {
            return convertLogicProcedure(value);
        }
        if (type == Procedure.class) {
            return convertProcedure(value);
        }
        if (type.isEnum() && value instanceof String string) {
            @SuppressWarnings({"unchecked", "rawtypes"})
            Object enumValue = Enum.valueOf((Class<? extends Enum>) type, string);
            return enumValue;
        }
        if (type.isInstance(value)) {
            return value;
        }
        throw new IllegalArgumentException("Unsupported value for type " + type.getSimpleName());
    }

    private Color convertColor(Object value) {
        if (value instanceof Color color) {
            return color;
        }
        if (value instanceof Number number) {
            return new Color(number.intValue(), true);
        }
        if (value instanceof Map<?, ?> map) {
            Object raw = map.containsKey("value") ? map.get("value") : map.get("rgb");
            if (raw instanceof Number number) {
                return new Color(number.intValue(), true);
            }
        }
        throw new IllegalArgumentException("Expected color int or {value:int}");
    }

    private Sound convertSound(Workspace workspace, Object value) {
        if (value instanceof Sound sound) {
            return sound;
        }
        if (value instanceof String string) {
            return new Sound(workspace, string);
        }
        if (value instanceof Map<?, ?> map && map.get("value") instanceof String string) {
            return new Sound(workspace, string);
        }
        throw new IllegalArgumentException("Expected sound string or {value:string}");
    }

    private MItemBlock convertMItemBlock(Workspace workspace, Object value) {
        if (value instanceof MItemBlock item) {
            return item;
        }
        if (value instanceof String string) {
            return new MItemBlock(workspace, string);
        }
        if (value instanceof Map<?, ?> map && map.get("value") instanceof String string) {
            return new MItemBlock(workspace, string);
        }
        throw new IllegalArgumentException("Expected item string or {value:string}");
    }

    private NumberProcedure convertNumberProcedure(Object value) {
        if (value instanceof NumberProcedure procedure) {
            return procedure;
        }
        if (value instanceof Number number) {
            return new NumberProcedure(null, number.doubleValue());
        }
        if (value instanceof Map<?, ?> map) {
            Object fixed = map.get("fixedValue");
            if (fixed instanceof Number number) {
                return new NumberProcedure(null, number.doubleValue());
            }
        }
        throw new IllegalArgumentException("Expected number or {fixedValue:number}");
    }

    private LogicProcedure convertLogicProcedure(Object value) {
        if (value instanceof LogicProcedure procedure) {
            return procedure;
        }
        if (value instanceof Boolean bool) {
            return new LogicProcedure(null, bool);
        }
        if (value instanceof Map<?, ?> map && map.get("fixedValue") instanceof Boolean bool) {
            return new LogicProcedure(null, bool);
        }
        throw new IllegalArgumentException("Expected boolean or {fixedValue:boolean}");
    }

    private Procedure convertProcedure(Object value) {
        if (value instanceof Procedure procedure) {
            return procedure;
        }
        if (value instanceof String string) {
            return new Procedure(string.isBlank() ? null : string);
        }
        if (value instanceof Map<?, ?> map) {
            Object name = map.get("name");
            if (name == null || (name instanceof String s && s.isBlank())) {
                return new Procedure(null);
            }
            if (name instanceof String string) {
                return new Procedure(string);
            }
        }
        throw new IllegalArgumentException("Expected procedure name or {name:string}");
    }

    private Field findAccessibleField(Class<?> type, String name) throws NoSuchFieldException {
        Class<?> current = type;
        while (current != null && current != Object.class) {
            try {
                Field field = current.getDeclaredField(name);
                field.setAccessible(true);
                return field;
            } catch (NoSuchFieldException ignored) {
                current = current.getSuperclass();
            }
        }
        // public field on type hierarchy
        return type.getField(name);
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

    private List<String> applyKnownSafeDefaults(Workspace workspace, GeneratableElement definition) {
        List<String> appliedDefaults = new ArrayList<>();
        Class<?> clazz = definition.getClass();

        while (clazz != null && clazz != Object.class) {
            for (Field field : clazz.getDeclaredFields()) {
                int modifiers = field.getModifiers();
                if (java.lang.reflect.Modifier.isStatic(modifiers) || java.lang.reflect.Modifier.isFinal(modifiers)
                        || java.lang.reflect.Modifier.isTransient(modifiers) || field.isSynthetic()) {
                    continue;
                }

                try {
                    field.setAccessible(true);
                    if (field.get(definition) != null) {
                        continue;
                    }

                    String name = field.getName();
                    Object defaultValue = null;

                    switch (name) {
                        case "aixml":
                            defaultValue = DEFAULT_CREATURE_AI_XML;
                            break;
                        case "mobModelGlowTexture":
                            defaultValue = "";
                            break;
                        case "equipmentMainHand":
                        case "equipmentOffHand":
                        case "equipmentHelmet":
                        case "equipmentBody":
                        case "equipmentLeggings":
                        case "equipmentBoots":
                        case "mobDrop":
                        case "rangedAttackItem":
                            defaultValue = new MItemBlock(workspace, "");
                            break;
                        case "breedTriggerItems":
                            defaultValue = new ArrayList<MItemBlock>();
                            break;
                        case "livingSound":
                        case "stepSound":
                        case "raidCelebrationSound":
                            defaultValue = new Sound(workspace, "");
                            break;
                        case "hurtSound":
                            defaultValue = new Sound(workspace, "entity.generic.hurt");
                            break;
                        case "deathSound":
                            defaultValue = new Sound(workspace, "entity.generic.death");
                            break;
                        case "transparentModelCondition":
                        case "isShakingCondition":
                        case "solidBoundingBox":
                            defaultValue = new LogicProcedure(null, false);
                            break;
                        case "visualScale":
                        case "boundingBoxScale":
                            defaultValue = new NumberProcedure(null, 1.0);
                            break;
                        case "onStruckByLightning":
                        case "whenMobFalls":
                        case "whenMobDies":
                        case "whenMobIsHurt":
                        case "onRightClickedOn":
                        case "whenThisMobKillsAnother":
                        case "onMobTickUpdate":
                        case "onPlayerCollidesWith":
                        case "onInitialSpawn":
                        case "spawningCondition":
                            defaultValue = new Procedure(null);
                            break;
                    }

                    if (defaultValue != null) {
                        field.set(definition, defaultValue);
                        appliedDefaults.add(name);
                    }
                } catch (Exception ignored) {
                }
            }
            clazz = clazz.getSuperclass();
        }
        return appliedDefaults;
    }

    private List<String> applyAnimatedEntitySensibleDefaults(Workspace workspace, GeneratableElement definition,
            String elementType) {
        List<String> applied = new ArrayList<>();
        if (!"animatedentity".equals(elementType)) {
            return applied;
        }
        applied.addAll(setIntIfZero(definition, "deathTime", 20));
        applied.addAll(setIntIfZero(definition, "lerp", 4));
        applied.addAll(setStringIfBlank(definition, "animation1", "idle"));
        applied.addAll(setStringIfBlank(definition, "animation2", "walk"));
        applied.addAll(setBooleanIfFalse(definition, "enable2", true));
        applied.addAll(setStringIfBlank(definition, "aiBase", "(none)"));
        applied.addAll(setStringIfBlank(definition, "guiBoundTo", "<NONE>"));
        try {
            Field aixml = findAccessibleField(definition.getClass(), "aixml");
            Object current = aixml.get(definition);
            if (current instanceof String xml && xml.contains("aitasks_container") && !xml.contains("wander")) {
                aixml.set(definition, DEFAULT_CREATURE_AI_XML);
                applied.add("aixml");
            }
        } catch (Exception ignored) {
        }
        return applied;
    }

    private List<String> setIntIfZero(Object target, String fieldName, int value) {
        try {
            Field field = findAccessibleField(target.getClass(), fieldName);
            Object current = field.get(target);
            if (current instanceof Number number && number.intValue() == 0) {
                if (field.getType() == int.class || field.getType() == Integer.class) {
                    field.set(target, value);
                    return List.of(fieldName);
                }
            }
        } catch (Exception ignored) {
        }
        return List.of();
    }

    private List<String> setStringIfBlank(Object target, String fieldName, String value) {
        try {
            Field field = findAccessibleField(target.getClass(), fieldName);
            Object current = field.get(target);
            if (current == null || (current instanceof String s && s.isBlank())) {
                field.set(target, value);
                return List.of(fieldName);
            }
        } catch (Exception ignored) {
        }
        return List.of();
    }

    private List<String> setBooleanIfFalse(Object target, String fieldName, boolean value) {
        try {
            Field field = findAccessibleField(target.getClass(), fieldName);
            Object current = field.get(target);
            if (current instanceof Boolean bool && !bool && value) {
                field.set(target, true);
                return List.of(fieldName);
            }
        } catch (Exception ignored) {
        }
        return List.of();
    }

    private List<String> validateDefinitionForGeneration(GeneratableElement definition) {
        List<String> warnings = new ArrayList<>();
        Class<?> clazz = definition.getClass();

        while (clazz != null && clazz != Object.class) {
            for (Field field : clazz.getDeclaredFields()) {
                int modifiers = field.getModifiers();
                if (java.lang.reflect.Modifier.isStatic(modifiers) || java.lang.reflect.Modifier.isFinal(modifiers)
                        || java.lang.reflect.Modifier.isTransient(modifiers) || field.isSynthetic()) {
                    continue;
                }

                try {
                    field.setAccessible(true);
                    Object value = field.get(definition);
                    String name = field.getName();

                    if (value == null) {
                        if (name.equals("aixml") || name.startsWith("equipment") || name.endsWith("Sound")) {
                            warnings.add("Field '" + name + "' is null. This might cause code generation errors.");
                        }
                    } else if ("aixml".equals(name) && value instanceof String xml) {
                        if (!xml.trim().startsWith("<xml") || !xml.trim().endsWith("</xml>")) {
                            warnings.add("Field 'aixml' does not contain valid Blockly XML. This might cause Blockly parser errors.");
                        }
                    }
                } catch (Exception e) {
                    warnings.add("Could not inspect field '" + field.getName() + "' during validation: " + e.getMessage());
                }
            }
            clazz = clazz.getSuperclass();
        }
        return warnings;
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
                                 Map<String, Object> debug, List<String> registeredElementTypes,
                                 List<String> creatableElementTypes, Map<String, String> elementTypeAliases,
                                 boolean anyTypeCreatable, boolean allTypesCreatable) {
    }

    public record TypeAvailability(boolean typesAvailable, boolean anyTypeCreatable, boolean allTypesCreatable,
                                   List<String> registeredElementTypes, List<String> creatableElementTypes,
                                   Map<String, String> elementTypeAliases) {
    }

    public record AssetRoots(String workspaceModId, Path workspaceDir, Path modelsDir, Path animationsDir,
                             Path runtimeGeoDir, Path runtimeAnimationsDir, Map<String, Path> textureDirs) {
        public AssetRoots(String workspaceModId, Path workspaceDir, Path modelsDir, Path animationsDir,
                Map<String, Path> textureDirs) {
            this(workspaceModId, workspaceDir, modelsDir, animationsDir,
                    workspaceDir.resolve("src").resolve("main").resolve("resources").resolve("assets")
                            .resolve(workspaceModId == null ? "modid" : workspaceModId).resolve("geo"),
                    workspaceDir.resolve("src").resolve("main").resolve("resources").resolve("assets")
                            .resolve(workspaceModId == null ? "modid" : workspaceModId).resolve("animations"),
                    textureDirs);
        }
    }

    public record GeckoLibAssets(String workspaceModId, String baseAssetsDir, List<String> geoModels,
                                 List<String> animations, List<String> textures, List<String> invalidJsonFiles,
                                 List<String> orphanCandidates, List<String> warnings) {
    }

    public record AssetImportEntry(String sourcePath, String kind, String textureSubdir, String targetName) {
        public AssetImportEntry(String sourcePath, String kind, String textureSubdir) {
            this(sourcePath, kind, textureSubdir, null);
        }
    }

    public record AssetImportRequest(List<AssetImportEntry> assets, boolean overwrite) {
    }

    public record AssetImportResult(List<Map<String, String>> imported, List<Map<String, String>> skipped,
                                    List<String> warnings) {
    }

    public record ValidationResult(boolean valid, String elementName, String elementType, List<String> problems,
                                   List<String> warnings) {
    }

    public record CreateElementResult(String message, List<String> appliedDefaults, List<String> validationWarnings,
                                      boolean confirmed, String elementName, String elementType, String registryName,
                                      String recognizedInMemory, String definitionStored, String definitionLoadable,
                                      String workspaceEntryStored, List<String> problems, List<String> warnings,
                                      List<String> appliedFields, List<String> skippedFields,
                                      List<String> generatedFiles) {
        public CreateElementResult {
            appliedFields = appliedFields == null ? List.of() : List.copyOf(appliedFields);
            skippedFields = skippedFields == null ? List.of() : List.copyOf(skippedFields);
            generatedFiles = generatedFiles == null ? List.of() : List.copyOf(generatedFiles);
        }
    }

    public record CreationConfirmation(boolean confirmed, List<String> problems, List<String> warnings) {
    }

    public record GenerateElementResult(String status, String elementName, List<String> generatedFiles,
                                        List<String> deletedFiles, List<String> modifiedFiles,
                                        List<String> metadataFiles, List<String> warnings, String message,
                                        boolean baseGenerated, boolean gradleRestored) {
        public GenerateElementResult {
            generatedFiles = generatedFiles == null ? List.of() : List.copyOf(generatedFiles);
            deletedFiles = deletedFiles == null ? List.of() : List.copyOf(deletedFiles);
            modifiedFiles = modifiedFiles == null ? List.of() : List.copyOf(modifiedFiles);
            metadataFiles = metadataFiles == null ? List.of() : List.copyOf(metadataFiles);
            warnings = warnings == null ? List.of() : List.copyOf(warnings);
        }
    }

    private record DefinitionApplyResult(List<String> appliedFields, List<String> skippedFields) {
    }

    private record InstantiatedStorage(GeneratableElement definition, List<String> appliedDefaults,
                                       List<String> validationWarnings, List<String> appliedFields,
                                       List<String> skippedFields) {
        List<String> warnings() {
            return validationWarnings;
        }
    }

    private record TargetSpec(Path path, String location) {
    }

    private record PreparedAsset(String kind, Path source, Path target, Path relativeTarget, boolean skip,
                                 String skipReason, boolean existedBefore, String location) {
    }
}
