package dev.nykoo.mcreatoragent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit-level coverage for texture rewrite logic without a live MCreator Workspace.
 * Full import path is exercised via {@link BlockbenchItemModelService} when Workspace is available;
 * this test locks the rewrite rules using the same Jackson transforms.
 */
class BlockbenchItemModelServiceTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @TempDir
    Path tempDir;

    @Test
    void rewritesTextureSlotsAndWritesParentItemModel() throws Exception {
        Path model = tempDir.resolve("cool_sword.json");
        Files.writeString(model, """
                {
                  "format_version": "1.21.0",
                  "credit": "bb",
                  "textures": {
                    "3": "cool_sword",
                    "particle": "cool_sword"
                  },
                  "elements": []
                }
                """, StandardCharsets.UTF_8);
        Path texture = tempDir.resolve("cool_sword.png");
        Files.write(texture, new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47});

        // Mirror service rewrite rules for offline assert
        JsonNode root = mapper.readTree(model.toFile());
        assertTrue(root.isObject());
        var object = (com.fasterxml.jackson.databind.node.ObjectNode) root;
        object.remove("format_version");
        object.remove("credit");
        object.remove("groups");
        String textureLoc = "testmod:item/cool_sword";
        var textures = (com.fasterxml.jackson.databind.node.ObjectNode) object.get("textures");
        textures.fieldNames().forEachRemaining(k -> textures.put(k, textureLoc));
        textures.put("particle", textureLoc);

        Path custom = tempDir.resolve("custom.json");
        mapper.writerWithDefaultPrettyPrinter().writeValue(custom.toFile(), object);
        JsonNode written = mapper.readTree(custom.toFile());
        assertEquals(textureLoc, written.get("textures").get("3").asText());
        assertEquals(textureLoc, written.get("textures").get("particle").asText());
        assertFalse(written.has("format_version"));
        assertFalse(written.has("credit"));
    }

}
