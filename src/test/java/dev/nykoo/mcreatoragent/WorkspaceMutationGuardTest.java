package dev.nykoo.mcreatoragent;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class WorkspaceMutationGuardTest {

    @TempDir
    Path tempDir;

    @Test
    void restoresProtectedGradleWhenRewritten() throws Exception {
        Path srcMainJava = tempDir.resolve("src/main/java");
        Files.createDirectories(srcMainJava);
        Files.writeString(srcMainJava.resolve("KeepMe.java"), "class KeepMe {}", StandardCharsets.UTF_8);

        Path gradle = tempDir.resolve("mcreator.gradle");
        String original = """
                repositories {
                  flatDir { dirs 'libs' }
                }
                dependencies {
                  implementation fg.deobf('blank:enderframework:1.0.0')
                }
                """;
        Files.writeString(gradle, original, StandardCharsets.UTF_8);

        WorkspaceMutationGuard.WorkspaceSnapshot snapshot =
                WorkspaceMutationGuard.snapshot(tempDir, WorkspaceMutationGuard.DEFAULT_PROTECT_RELATIVE_PATHS);

        Files.writeString(gradle, "dependencies {}\n", StandardCharsets.UTF_8);
        Files.delete(srcMainJava.resolve("KeepMe.java"));
        Files.writeString(srcMainJava.resolve("New.java"), "class New {}", StandardCharsets.UTF_8);

        WorkspaceMutationGuard.MutationReport report = WorkspaceMutationGuard.diffAndProtect(
                tempDir, snapshot, WorkspaceMutationGuard.DEFAULT_PROTECT_RELATIVE_PATHS, true);

        assertTrue(report.deletedFiles().contains("src/main/java/KeepMe.java")
                || report.deletedFiles().stream().anyMatch(p -> p.endsWith("KeepMe.java")));
        assertTrue(report.addedFiles().stream().anyMatch(p -> p.endsWith("New.java")));
        assertTrue(report.restoredProtectedFiles().contains("mcreator.gradle"));
        assertEquals(original, Files.readString(gradle, StandardCharsets.UTF_8));
        assertTrue(report.warnings().stream().anyMatch(w -> w.contains("Restored protected file")));
    }

    @Test
    void reportsProtectedChangeWithoutRestoreWhenDisabled() throws Exception {
        Path gradle = tempDir.resolve("mcreator.gradle");
        Files.writeString(gradle, "dependencies { old }\n", StandardCharsets.UTF_8);
        WorkspaceMutationGuard.WorkspaceSnapshot snapshot =
                WorkspaceMutationGuard.snapshot(tempDir, List.of("mcreator.gradle"));

        Files.writeString(gradle, "dependencies { new }\n", StandardCharsets.UTF_8);
        WorkspaceMutationGuard.MutationReport report =
                WorkspaceMutationGuard.diffAndProtect(tempDir, snapshot, List.of("mcreator.gradle"), false);

        assertTrue(report.modifiedFiles().contains("mcreator.gradle"));
        assertTrue(report.restoredProtectedFiles().isEmpty());
        assertEquals("dependencies { new }\n", Files.readString(gradle, StandardCharsets.UTF_8));
        assertTrue(report.warnings().stream().anyMatch(w -> w.contains("was not restored")));
    }
}
