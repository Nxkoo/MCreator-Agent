package dev.nykoo.mcreatoragent;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Snapshot/diff helpers for workspace mutations such as regenerate and base generation.
 * Protects critical custom files (especially {@code mcreator.gradle}) that full regen may rewrite.
 */
public final class WorkspaceMutationGuard {

    public static final List<String> DEFAULT_PROTECT_RELATIVE_PATHS = List.of(
            "mcreator.gradle",
            "build.gradle",
            "settings.gradle",
            "gradle.properties");

    private WorkspaceMutationGuard() {
    }

    public static WorkspaceSnapshot snapshot(Path workspaceDir, Collection<String> protectRelativePaths)
            throws IOException {
        Objects.requireNonNull(workspaceDir, "workspaceDir");
        Path normalizedRoot = workspaceDir.toAbsolutePath().normalize();
        Map<String, String> fileHashes = new LinkedHashMap<>();
        Path srcMain = normalizedRoot.resolve("src").resolve("main");
        if (Files.isDirectory(srcMain)) {
            try (Stream<Path> walk = Files.walk(srcMain)) {
                walk.filter(Files::isRegularFile)
                        .forEach(path -> {
                            try {
                                String rel = normalizedRoot.relativize(path.toAbsolutePath().normalize())
                                        .toString().replace('\\', '/');
                                fileHashes.put(rel, sha256(path));
                            } catch (Exception ignored) {
                            }
                        });
            }
        }

        Map<String, String> protectedContents = new LinkedHashMap<>();
        for (String relative : protectRelativePaths == null ? DEFAULT_PROTECT_RELATIVE_PATHS : protectRelativePaths) {
            Path file = normalizedRoot.resolve(relative).normalize();
            if (!file.startsWith(normalizedRoot)) {
                continue;
            }
            if (Files.isRegularFile(file)) {
                protectedContents.put(relative.replace('\\', '/'), Files.readString(file, StandardCharsets.UTF_8));
                fileHashes.putIfAbsent(relative.replace('\\', '/'), sha256(file));
            }
        }

        return new WorkspaceSnapshot(normalizedRoot.toString(), fileHashes, protectedContents,
                System.currentTimeMillis());
    }

    public static MutationReport diffAndProtect(Path workspaceDir, WorkspaceSnapshot before,
            Collection<String> protectRelativePaths, boolean restoreProtected) throws IOException {
        WorkspaceSnapshot after = snapshot(workspaceDir, protectRelativePaths);
        Set<String> beforeKeys = before.fileHashes().keySet();
        Set<String> afterKeys = after.fileHashes().keySet();

        List<String> deleted = beforeKeys.stream()
                .filter(key -> !afterKeys.contains(key))
                .sorted()
                .collect(Collectors.toList());
        List<String> added = afterKeys.stream()
                .filter(key -> !beforeKeys.contains(key))
                .sorted()
                .collect(Collectors.toList());
        List<String> modified = beforeKeys.stream()
                .filter(afterKeys::contains)
                .filter(key -> !Objects.equals(before.fileHashes().get(key), after.fileHashes().get(key)))
                .sorted()
                .collect(Collectors.toList());

        List<String> restored = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        Path root = workspaceDir.toAbsolutePath().normalize();
        for (Map.Entry<String, String> entry : before.protectedContents().entrySet()) {
            String relative = entry.getKey();
            Path file = root.resolve(relative).normalize();
            if (!file.startsWith(root)) {
                continue;
            }
            String current = Files.isRegularFile(file)
                    ? Files.readString(file, StandardCharsets.UTF_8)
                    : null;
            if (!Objects.equals(entry.getValue(), current)) {
                if (restoreProtected) {
                    Files.createDirectories(file.getParent());
                    Files.writeString(file, entry.getValue(), StandardCharsets.UTF_8);
                    restored.add(relative);
                    warnings.add("Restored protected file after mutation: " + relative);
                } else {
                    warnings.add("Protected file changed by mutation and was not restored: " + relative);
                }
            }
        }

        return new MutationReport(deleted, added, modified, restored, warnings);
    }

    private static String sha256(Path path) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(Files.readAllBytes(path));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IOException("Failed to hash " + path + ": " + e.getMessage(), e);
        }
    }

    public record WorkspaceSnapshot(String workspaceDir, Map<String, String> fileHashes,
                                    Map<String, String> protectedContents, long capturedAtMs) {
    }

    public record MutationReport(List<String> deletedFiles, List<String> addedFiles, List<String> modifiedFiles,
                                 List<String> restoredProtectedFiles, List<String> warnings) {
    }
}
