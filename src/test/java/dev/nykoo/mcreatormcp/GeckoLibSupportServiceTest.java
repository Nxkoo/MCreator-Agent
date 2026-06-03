package dev.nykoo.mcreatormcp;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import net.mcreator.workspace.Workspace;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

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
    void assetListingReportsModelsAnimationsTexturesAndInvalidJson() throws Exception {
        Path workspace = tempDir.resolve("workspace");
        Path models = workspace.resolve("models");
        Path animations = workspace.resolve("models").resolve("animations");
        Path itemTextures = workspace.resolve("src/main/resources/assets/testmod/textures/item");
        Files.createDirectories(models);
        Files.createDirectories(animations);
        Files.createDirectories(itemTextures);
        Files.writeString(models.resolve("test.geo.json"), "{\"format_version\":\"1.12.0\"}");
        Files.writeString(animations.resolve("walk.animation.json"), "{\"animations\":{}}");
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
        assertTrue(assets.animations().stream().anyMatch(asset -> asset.endsWith("walk.animation.json")));
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

        assertEquals(3, result.imported().size());
        assertTrue(result.skipped().isEmpty());
        assertTrue(Files.exists(models.resolve("item.geo.json")));
        assertTrue(Files.exists(animations.resolve("idle.animation.json")));
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
    void assetImportSkipsDuplicateWhenOverwriteIsFalse() throws Exception {
        Path workspace = tempDir.resolve("workspace");
        Path models = workspace.resolve("models");
        Path animations = workspace.resolve("models").resolve("animations");
        Path itemTextures = workspace.resolve("src/main/resources/assets/testmod/textures/item");
        Files.createDirectories(models);
        Files.createDirectories(animations);
        Files.createDirectories(itemTextures);
        Files.writeString(models.resolve("item.geo.json"), "{\"existing\":true}");

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
        assertEquals(1, result.skipped().size());
        assertEquals("{\"existing\":true}", Files.readString(models.resolve("item.geo.json")));
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
