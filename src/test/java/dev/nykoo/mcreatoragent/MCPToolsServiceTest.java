package dev.nykoo.mcreatoragent;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MCPToolsServiceTest {

    @Test
    void animatedGeckoLibTypesAreRecognizedBeforeGenericCreation() {
        assertTrue(MCPToolsService.isGeckoLibAnimatedElementType("animateditem"));
        assertTrue(MCPToolsService.isGeckoLibAnimatedElementType(" AnimatedEntity "));
        assertTrue(MCPToolsService.isGeckoLibAnimatedElementType("animatedblock"));
        assertTrue(MCPToolsService.isGeckoLibAnimatedElementType("animatedarmor"));
    }

    @Test
    void nonGeckoLibTypesAreAllowedThroughGenericCreationPath() {
        assertFalse(MCPToolsService.isGeckoLibAnimatedElementType("item"));
        assertFalse(MCPToolsService.isGeckoLibAnimatedElementType("livingentity"));
        assertFalse(MCPToolsService.isGeckoLibAnimatedElementType(null));
    }
}
