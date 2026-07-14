package dev.nykoo.mcreatoragent;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.mcreator.workspace.Workspace;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class GeckoLibSupportServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void statusWithoutPluginLoaderDoesNotThrowAndReportsMissingPlugin() {
        GeckoLibSupportService service = new GeckoLibSupportService();

        GeckoLibSupportService.GeckoLibStatus status = service.getStatus((Workspace) null);

        assertFalse(status.pluginLoaded());
        assertFalse(status.apiEnabled());
        assertFalse(status.generatorSupportsApi());
        assertFalse(status.typesAvailable());
        assertTrue(status.availableElementTypes().isEmpty());
        assertTrue(status.problems().contains("GeckoLib Plugin is not loaded."));
    }

    @Test
    void canonicalRegisteredTypesDoNotRequireLegacyAliases() {
        GeckoLibSupportService.TypeAvailability availability = GeckoLibSupportService.evaluateTypeAvailability(
                Set.of("animateditem", "animatedentity", "animatedblock", "animatedarmor"),
                Set.of("animateditem", "animatedentity", "animatedblock", "animatedarmor"),
                true, true, true);

        assertTrue(availability.typesAvailable());
        assertTrue(availability.anyTypeCreatable());
        assertTrue(availability.allTypesCreatable());
        assertEquals(4, availability.registeredElementTypes().size());
        assertEquals(4, availability.creatableElementTypes().size());
        assertEquals("animateditem", availability.elementTypeAliases().get("geckoitem"));
    }

    @Test
    void aliasesDoNotReplaceCanonicalPluginRegistrations() {
        GeckoLibSupportService.TypeAvailability availability = GeckoLibSupportService.evaluateTypeAvailability(
                Set.of("geckoitem"),
                Set.of("animateditem"),
                true, true, true);

        assertFalse(availability.typesAvailable());
        assertFalse(availability.anyTypeCreatable());
        assertTrue(availability.registeredElementTypes().isEmpty());
        assertTrue(availability.creatableElementTypes().isEmpty());
    }

    @Test
    void partialPluginKeepsLegacyTypesUnavailableWhileRequestedCanonicalTypeIsCreatable() {
        GeckoLibSupportService.TypeAvailability availability = GeckoLibSupportService.evaluateTypeAvailability(
                Set.of("animateditem"),
                Set.of("animateditem"),
                true, true, true);

        assertFalse(availability.typesAvailable());
        assertTrue(availability.anyTypeCreatable());
        assertFalse(availability.allTypesCreatable());
        assertEquals(List.of("animateditem"), availability.creatableElementTypes());
        assertTrue(GeckoLibSupportService.isElementTypeCreatable(availability.creatableElementTypes(), "geckoitem"));
        assertFalse(GeckoLibSupportService.isElementTypeCreatable(availability.creatableElementTypes(), "animatedentity"));
    }

    @Test
    void allRegisteredTypesKeepLegacyAvailabilityWhenApiIsNotReady() {
        GeckoLibSupportService.TypeAvailability availability = GeckoLibSupportService.evaluateTypeAvailability(
                Set.of("animateditem", "animatedentity", "animatedblock", "animatedarmor"),
                Set.of("animateditem", "animatedentity", "animatedblock", "animatedarmor"),
                true, false, true);

        assertTrue(availability.typesAvailable());
        assertFalse(availability.anyTypeCreatable());
        assertFalse(availability.allTypesCreatable());
        assertEquals(4, availability.registeredElementTypes().size());
        assertTrue(availability.creatableElementTypes().isEmpty());
    }

    @Test
    void creatableFallsBackToRegisteredWhenGeneratorOmitsAnimatedTypes() {
        GeckoLibSupportService.TypeAvailability availability = GeckoLibSupportService.evaluateTypeAvailability(
                Set.of("animateditem", "animatedentity", "animatedblock", "animatedarmor"),
                Set.of("item", "block", "procedure"),
                true, true, true);

        assertTrue(availability.typesAvailable());
        assertTrue(availability.anyTypeCreatable());
        assertTrue(availability.allTypesCreatable());
        assertEquals(4, availability.creatableElementTypes().size());
        assertTrue(GeckoLibSupportService.isElementTypeCreatable(availability.creatableElementTypes(), "animatedentity"));
    }

    @Test
    void typesAvailableMeansAllCanonicalTypesAreRegisteredNotCreatable() {
        GeckoLibSupportService.TypeAvailability availability = GeckoLibSupportService.evaluateTypeAvailability(
                Set.of("animateditem", "animatedentity"),
                Set.of("animateditem", "animatedentity"),
                true, true, true);

        assertFalse(availability.typesAvailable());
        assertTrue(availability.anyTypeCreatable());
        assertEquals(2, availability.creatableElementTypes().size());
    }

    @Test
    void creationConfirmationDoesNotPretendUnknownPostconditionPassed() {
        GeckoLibSupportService.CreationConfirmation confirmation =
                GeckoLibSupportService.evaluateCreationConfirmation(
                        "pass", "pass", "pass", "unknown");

        assertFalse(confirmation.confirmed());
        assertTrue(confirmation.warnings().stream().anyMatch(warning -> warning.contains("unknown")));
    }

    @Test
    void creationConfirmationRequiresEveryPostconditionToPass() {
        GeckoLibSupportService.CreationConfirmation confirmation =
                GeckoLibSupportService.evaluateCreationConfirmation(
                        "pass", "pass", "pass", "pass");

        assertTrue(confirmation.confirmed());
        assertTrue(confirmation.problems().isEmpty());
        assertTrue(confirmation.warnings().isEmpty());
    }

    @Test
    void statusSerializationPreservesLegacyFieldsAndAddsExplicitTypeFields() throws Exception {
        GeckoLibSupportService.GeckoLibStatus status = new GeckoLibSupportService.GeckoLibStatus(
                true, true, true, true, List.of("animateditem"), List.of(), Map.of(),
                List.of("animateditem"), List.of("animateditem"), Map.of("geckoitem", "animateditem"), true, false);

        JsonNode json = new ObjectMapper().valueToTree(status);

        assertTrue(json.has("typesAvailable"));
        assertTrue(json.has("availableElementTypes"));
        assertTrue(json.has("registeredElementTypes"));
        assertTrue(json.has("creatableElementTypes"));
        assertTrue(json.has("elementTypeAliases"));
        assertTrue(json.has("anyTypeCreatable"));
        assertTrue(json.has("allTypesCreatable"));
    }

    @Test
    void creationResultSerializationIncludesConfirmationLayers() {
        GeckoLibSupportService.CreateElementResult result = new GeckoLibSupportService.CreateElementResult(
                "Created", List.of(), List.of(), false, "NeedleScratch", "animateditem", "needle_scratch",
                "pass", "pass", "pass", "unknown", List.of(), List.of("manual refresh may be required"));

        JsonNode json = new ObjectMapper().valueToTree(result);

        assertFalse(json.get("confirmed").asBoolean());
        assertEquals("pass", json.get("recognizedInMemory").asText());
        assertEquals("unknown", json.get("workspaceEntryStored").asText());
        assertTrue(json.has("message"));
        assertTrue(json.has("appliedDefaults"));
        assertTrue(json.has("validationWarnings"));
    }

    @Test
    void assetListingReportsModelsAnimationsTexturesAndInvalidJson() throws Exception {
        Path workspace = tempDir.resolve("workspace");
        Path models = workspace.resolve("models");
        Path animations = workspace.resolve("models").resolve("animations");
        Path runtimeGeo = workspace.resolve("src/main/resources/assets/testmod/geo");
        Path runtimeAnimations = workspace.resolve("src/main/resources/assets/testmod/animations");
        Path itemTextures = workspace.resolve("src/main/resources/assets/testmod/textures/item");
        Files.createDirectories(models);
        Files.createDirectories(animations);
        Files.createDirectories(runtimeGeo);
        Files.createDirectories(runtimeAnimations);
        Files.createDirectories(itemTextures);
        Files.writeString(models.resolve("test.geo.json"), "{\"format_version\":\"1.12.0\"}");
        Files.writeString(runtimeGeo.resolve("runtime_only.geo.json"), "{\"format_version\":\"1.12.0\"}");
        Files.writeString(animations.resolve("walk.animation.json"), "{\"animations\":{}}");
        Files.writeString(runtimeAnimations.resolve("idle.animation.json"), "{\"animations\":{}}");
        Files.writeString(itemTextures.resolve("test.png"), "png");
        Files.writeString(models.resolve("broken.geo.json"), "{");

        GeckoLibSupportService.AssetRoots roots = new GeckoLibSupportService.AssetRoots(
                "testmod",
                workspace,
                models,
                animations,
                Map.of("item", itemTextures)
        );

        GeckoLibSupportService.GeckoLibAssets assets = new GeckoLibSupportService().listAssets(roots);

        assertEquals("testmod", assets.workspaceModId());
        assertTrue(assets.geoModels().stream().anyMatch(asset -> asset.endsWith("test.geo.json")));
        assertTrue(assets.geoModels().stream().anyMatch(asset -> asset.endsWith("runtime_only.geo.json")));
        assertTrue(assets.animations().stream().anyMatch(asset -> asset.endsWith("walk.animation.json")));
        assertTrue(assets.animations().stream().anyMatch(asset -> asset.endsWith("idle.animation.json")));
        assertTrue(assets.textures().stream().anyMatch(asset -> asset.endsWith("test.png")));
        assertTrue(assets.invalidJsonFiles().stream().anyMatch(asset -> asset.endsWith("broken.geo.json")));
    }

    @Test
    void assetImportFailsBeforeCopyingWhenAnyAssetIsInvalid() throws Exception {
        Path workspace = tempDir.resolve("workspace");
        Path models = workspace.resolve("models");
        Path animations = workspace.resolve("models").resolve("animations");
        Path itemTextures = workspace.resolve("src/main/resources/assets/testmod/textures/item");
        Files.createDirectories(models);
        Files.createDirectories(animations);
        Files.createDirectories(itemTextures);

        Path validModel = tempDir.resolve("valid.geo.json");
        Path invalidAnimation = tempDir.resolve("bad.txt");
        Files.writeString(validModel, "{\"format_version\":\"1.12.0\"}");
        Files.writeString(invalidAnimation, "{\"animations\":{}}");

        GeckoLibSupportService.AssetRoots roots = new GeckoLibSupportService.AssetRoots(
                "testmod",
                workspace,
                models,
                animations,
                Map.of("item", itemTextures)
        );

        GeckoLibSupportService.AssetImportRequest request = new GeckoLibSupportService.AssetImportRequest(
                List.of(
                        new GeckoLibSupportService.AssetImportEntry(validModel.toString(), "geo_model", null),
                        new GeckoLibSupportService.AssetImportEntry(invalidAnimation.toString(), "animation", null)
                ),
                false
        );

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> new GeckoLibSupportService().importAssets(roots, request));

        assertTrue(error.getMessage().contains("Expected .animation.json"));
        assertFalse(Files.exists(models.resolve("valid.geo.json")));
        try (var copiedFiles = Files.list(models).filter(Files::isRegularFile)) {
            assertEquals(0, copiedFiles.count());
        }
    }

    @Test
    void assetImportCopiesAllSupportedAssetsTransactionally() throws Exception {
        Path workspace = tempDir.resolve("workspace");
        Path models = workspace.resolve("models");
        Path animations = workspace.resolve("models").resolve("animations");
        Path itemTextures = workspace.resolve("src/main/resources/assets/testmod/textures/item");
        Files.createDirectories(models);
        Files.createDirectories(animations);
        Files.createDirectories(itemTextures);

        Path model = tempDir.resolve("item.geo.json");
        Path animation = tempDir.resolve("idle.animation.json");
        Path texture = tempDir.resolve("item.png");
        Files.writeString(model, "{\"format_version\":\"1.12.0\"}");
        Files.writeString(animation, "{\"animations\":{}}");
        Files.writeString(texture, "png");

        GeckoLibSupportService.AssetImportResult result = new GeckoLibSupportService().importAssets(
                assetRoots(workspace, models, animations, itemTextures),
                new GeckoLibSupportService.AssetImportRequest(
                        List.of(
                                new GeckoLibSupportService.AssetImportEntry(model.toString(), "geo_model", null),
                                new GeckoLibSupportService.AssetImportEntry(animation.toString(), "animation", null),
                                new GeckoLibSupportService.AssetImportEntry(texture.toString(), "texture", "item")
                        ),
                        false
                )
        );

        // geo + animation dual-write (authoring + runtime) + texture = 5 targets
        assertEquals(5, result.imported().size());
        assertTrue(result.skipped().isEmpty());
        assertTrue(Files.exists(models.resolve("item.geo.json")));
        assertTrue(Files.exists(workspace.resolve("src/main/resources/assets/testmod/geo/item.geo.json")));
        assertTrue(Files.exists(animations.resolve("idle.animation.json")));
        assertTrue(Files.exists(workspace.resolve("src/main/resources/assets/testmod/animations/idle.animation.json")));
        assertTrue(Files.exists(itemTextures.resolve("item.png")));
        Path mcreatorDir = workspace.resolve(".mcreator");
        if (Files.exists(mcreatorDir)) {
            try (var stagingEntries = Files.list(mcreatorDir)
                    .filter(path -> path.getFileName().toString().startsWith("mcp-geckolib-import-"))) {
                assertEquals(0, stagingEntries.count());
            }
        }
    }

    @Test
    void assetImportHandlesTargetNameAndGeoAlias() throws Exception {
        Path workspace = tempDir.resolve("workspace");
        Path models = workspace.resolve("models");
        Path animations = workspace.resolve("models").resolve("animations");
        Path itemTextures = workspace.resolve("src/main/resources/assets/testmod/textures/item");
        Files.createDirectories(models);
        Files.createDirectories(animations);
        Files.createDirectories(itemTextures);

        Path model = tempDir.resolve("some_weird_name.json");
        Files.writeString(model, "{\"format_version\":\"1.12.0\"}");

        GeckoLibSupportService.AssetImportResult result = new GeckoLibSupportService().importAssets(
                assetRoots(workspace, models, animations, itemTextures),
                new GeckoLibSupportService.AssetImportRequest(
                        List.of(
                                new GeckoLibSupportService.AssetImportEntry(model.toString(), "geo", null, "custom.geo.json")
                        ),
                        false
                )
        );

        assertEquals(2, result.imported().size());
        assertTrue(Files.exists(models.resolve("custom.geo.json")));
        assertTrue(Files.exists(workspace.resolve("src/main/resources/assets/testmod/geo/custom.geo.json")));
    }

    @Test
    void assetImportSkipsDuplicateWhenOverwriteIsFalse() throws Exception {
        Path workspace = tempDir.resolve("workspace");
        Path models = workspace.resolve("models");
        Path animations = workspace.resolve("models").resolve("animations");
        Path runtimeGeo = workspace.resolve("src/main/resources/assets/testmod/geo");
        Path itemTextures = workspace.resolve("src/main/resources/assets/testmod/textures/item");
        Files.createDirectories(models);
        Files.createDirectories(animations);
        Files.createDirectories(runtimeGeo);
        Files.createDirectories(itemTextures);
        Files.writeString(models.resolve("item.geo.json"), "{\"existing\":true}");
        Files.writeString(runtimeGeo.resolve("item.geo.json"), "{\"existing_runtime\":true}");

        Path incoming = tempDir.resolve("item.geo.json");
        Files.writeString(incoming, "{\"incoming\":true}");

        GeckoLibSupportService.AssetImportResult result = new GeckoLibSupportService().importAssets(
                assetRoots(workspace, models, animations, itemTextures),
                new GeckoLibSupportService.AssetImportRequest(
                        List.of(new GeckoLibSupportService.AssetImportEntry(incoming.toString(), "geo_model", null)),
                        false
                )
        );

        assertTrue(result.imported().isEmpty());
        assertEquals(2, result.skipped().size());
        assertEquals("{\"existing\":true}", Files.readString(models.resolve("item.geo.json")));
        assertEquals("{\"existing_runtime\":true}", Files.readString(runtimeGeo.resolve("item.geo.json")));
    }

    @Test
    void assetImportRollsBackWhenStagedJsonValidationFails() throws Exception {
        Path workspace = tempDir.resolve("workspace");
        Path models = workspace.resolve("models");
        Path animations = workspace.resolve("models").resolve("animations");
        Path itemTextures = workspace.resolve("src/main/resources/assets/testmod/textures/item");
        Files.createDirectories(models);
        Files.createDirectories(animations);
        Files.createDirectories(itemTextures);

        Path validModel = tempDir.resolve("valid.geo.json");
        Path invalidAnimation = tempDir.resolve("broken.animation.json");
        Files.writeString(validModel, "{\"format_version\":\"1.12.0\"}");
        Files.writeString(invalidAnimation, "{");

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> new GeckoLibSupportService().importAssets(
                        assetRoots(workspace, models, animations, itemTextures),
                        new GeckoLibSupportService.AssetImportRequest(
                                List.of(
                                        new GeckoLibSupportService.AssetImportEntry(validModel.toString(), "geo_model", null),
                                        new GeckoLibSupportService.AssetImportEntry(invalidAnimation.toString(), "animation", null)
                                ),
                                false
                        )
                ));

        assertTrue(error.getMessage().contains("Failed to import GeckoLib assets transactionally"));
        assertFalse(Files.exists(models.resolve("valid.geo.json")));
        assertFalse(Files.exists(animations.resolve("broken.animation.json")));
    }

    @Test
    void validateElementWithoutWorkspaceReturnsClearProblem() {
        GeckoLibSupportService.ValidationResult result =
                new GeckoLibSupportService().validateElement(null, "TestAnimatedItem");

        assertFalse(result.valid());
        assertEquals("TestAnimatedItem", result.elementName());
        assertNull(result.elementType());
        assertTrue(result.problems().contains("No workspace loaded."));
        assertTrue(result.warnings().isEmpty());
    }

    @Test
    void validateElementRequiresElementName() {
        GeckoLibSupportService.ValidationResult result =
                new GeckoLibSupportService().validateElement(null, " ");

        assertFalse(result.valid());
        assertTrue(result.problems().contains("No workspace loaded."));
    }

    @Test
    void createElementRejectsMissingElementTypeBeforeWorkspaceAccess() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> new GeckoLibSupportService().createElement(null, Map.of("elementName", "TestAnimatedItem")));

        assertEquals("Element type is required", error.getMessage());
    }

    @Test
    void createElementRejectsUnsupportedAnimatedTypeBeforeWorkspaceAccess() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> new GeckoLibSupportService().createElement(null,
                        Map.of("elementType", "item", "elementName", "TestAnimatedItem")));

        assertEquals("Unsupported GeckoLib element type: item", error.getMessage());
    }

    @Test
    void createElementRejectsInvalidElementNameBeforeWorkspaceAccess() {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> new GeckoLibSupportService().createElement(null,
                        Map.of("elementType", "animateditem", "elementName", "123 invalid")));

        assertEquals("Element name must be a valid Java identifier and not a reserved word.", error.getMessage());
    }

    private static GeckoLibSupportService.AssetRoots assetRoots(Path workspace, Path models, Path animations,
            Path itemTextures) {
        return new GeckoLibSupportService.AssetRoots(
                "testmod",
                workspace,
                models,
                animations,
                Map.of("item", itemTextures)
        );
    }
}
