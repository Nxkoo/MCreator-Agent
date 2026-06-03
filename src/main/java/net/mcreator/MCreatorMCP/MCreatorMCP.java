package net.mcreator.MCreatorMCP;

import net.mcreator.MCreatorMCP.mcp.McpHttpTransport;
import net.mcreator.MCreatorMCP.mcp.McpServer;
import net.mcreator.plugin.JavaPlugin;
import net.mcreator.plugin.Plugin;
import net.mcreator.plugin.events.workspace.MCreatorLoadedEvent;
import net.mcreator.ui.MCreator;
import net.mcreator.ui.action.BasicAction;
import net.mcreator.ui.init.L10N;
import net.mcreator.ui.init.UIRES;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import javax.swing.*;
import java.io.IOException;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;

public class MCreatorMCP extends JavaPlugin {

    private static final Logger LOG = LogManager.getLogger("MCreatorMCP");
    private static final int DEFAULT_HTTP_PORT = 5175;
    private static final String SERVER_VERSION = "1.0.0-2024.4";
    
    private McpServer mcpServer;
    private McpHttpTransport httpTransport;
    private final MCPToolsService toolsService;
    private volatile int currentHttpPort = DEFAULT_HTTP_PORT;

    public MCreatorMCP(Plugin plugin) {
        super(plugin);

        toolsService = new MCPToolsService();

        addListener(MCreatorLoadedEvent.class, event -> SwingUtilities.invokeLater(() -> {
            startMCPServer(event);
            addMcpMenu(event);
        }));

        LOG.info("MCreator MCP plugin loaded for MCreator 2024.4");
    }

    private void startMCPServer(MCreatorLoadedEvent event) {
        try {
            stopMCPServer();

            int httpPort = findFreePort(DEFAULT_HTTP_PORT);
            currentHttpPort = httpPort;

            mcpServer = new McpServer("MCreator MCP Server", SERVER_VERSION);
            mcpServer.setWorkspace(event.getMCreator().getWorkspace());
            toolsService.registerTools(mcpServer, event.getMCreator());

            httpTransport = new McpHttpTransport(mcpServer, httpPort);
            httpTransport.start();
            writePortFile(httpPort);

            LOG.info("MCP server started on http://localhost:{}/mcp", httpPort);
        } catch (IOException e) {
            LOG.error("Failed to start MCP server", e);
            showErrorDialog(L10N.t("plugin.mcreator_mcp.server_error"),
                    "Failed to start MCP server: " + e.getMessage());
        }
    }

    private void stopMCPServer() {
        if (httpTransport != null) {
            LOG.info("Stopping MCP HTTP transport...");
            httpTransport.stop();
            httpTransport = null;
        }

        mcpServer = null;
        LOG.info("MCP server stopped");
    }

    private void restartMCPServer(MCreatorLoadedEvent event) {
        LOG.info("Restarting MCP server...");
        stopMCPServer();

        Timer restartTimer = new Timer(300, ignored -> startMCPServer(event));
        restartTimer.setRepeats(false);
        restartTimer.start();
    }

    private void addMcpMenu(MCreatorLoadedEvent event) {
        MCreator mcreator = event.getMCreator();

        BasicAction mcpStatusAction = new BasicAction(mcreator.getActionRegistry(),
                L10N.t("plugin.mcreator_mcp.menu.status"), e -> showMCPStatus());
        mcpStatusAction.setIcon(UIRES.get("16px.info"));

        BasicAction mcpRestartAction = new BasicAction(mcreator.getActionRegistry(),
                L10N.t("plugin.mcreator_mcp.menu.restart"), e -> restartMCPServer(event));
        mcpRestartAction.setIcon(UIRES.get("16px.reset"));

        JMenu menu = new JMenu(L10N.t("plugin.mcreator_mcp.menu.main"));
        menu.add(mcpStatusAction);
        menu.add(mcpRestartAction);

        mcreator.getMainMenuBar().add(menu);
        mcreator.getMainMenuBar().revalidate();
        mcreator.getMainMenuBar().repaint();
    }

    private void showMCPStatus() {
        String status;
        
        if (httpTransport != null && mcpServer != null) {
            status = "MCP Server Status: RUNNING\n" +
                    "HTTP Endpoint: http://localhost:" + currentHttpPort + "/mcp\n" +
                    "SSE Endpoint: http://localhost:" + currentHttpPort + "/mcp/sse\n" +
                    "Health Check: http://localhost:" + currentHttpPort + "/health\n" +
                    "Port File: " + getPortFile() + "\n" +
                    "Stdio: Disabled for MCreator GUI runtime\n" +
                    "Workspace: " + (mcpServer.getWorkspace() != null ? "Loaded" : "None");
        } else {
            status = "MCP Server Status: NOT RUNNING";
        }

        showInfoDialog("MCP Server Status", status);
    }

    private void showErrorDialog(String title, String message) {
        SwingUtilities.invokeLater(() -> 
            JOptionPane.showMessageDialog(null, message, title, JOptionPane.ERROR_MESSAGE));
    }

    private void showInfoDialog(String title, String message) {
        SwingUtilities.invokeLater(() -> 
            JOptionPane.showMessageDialog(null, message, title, JOptionPane.INFORMATION_MESSAGE));
    }

    private void writePortFile(int port) {
        Path portFile = getPortFile();
        try {
            Files.createDirectories(portFile.getParent());
            Files.writeString(portFile, Integer.toString(port));
        } catch (IOException e) {
            LOG.warn("Failed to write MCP port file: {}", portFile, e);
        }
    }

    private Path getPortFile() {
        return Path.of(System.getProperty("user.home"), ".mcreator", "mcp", "port");
    }

    /**
     * Find a free port, starting with the preferred port
     * @param preferredPort The port to try first
     * @return A free port number
     */
    private static int findFreePort(int preferredPort) {
        // Try preferred port first
        try (ServerSocket s = new ServerSocket(preferredPort)) {
            return preferredPort;
        } catch (IOException ignored) {
            // Preferred port is busy, find any free port
        }
        
        // Find any free port
        try (ServerSocket s = new ServerSocket(0)) {
            return s.getLocalPort();
        } catch (IOException e) {
            throw new RuntimeException("No free port available", e);
        }
    }
}
