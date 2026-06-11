import { createFileRoute } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { CodeBlock } from "@/components/site/CodeBlock";
import { Callout } from "@/components/site/Callout";

export const Route = createFileRoute("/docs/installation")({
  head: () => ({
    meta: [
      { title: "Installation — MCreator Agent" },
      {
        name: "description",
        content:
          "Download the MCreator Agent preview ZIP or build it from source, then add it to MCreator 2024.4.",
      },
      { property: "og:title", content: "Installation — MCreator Agent" },
      {
        property: "og:description",
        content:
          "Download the MCreator Agent preview ZIP or build it from source, then add it to MCreator 2024.4.",
      },
      { property: "og:url", content: "/docs/installation" },
    ],
    links: [{ rel: "canonical", href: "/docs/installation" }],
  }),
  component: Install,
});

function Install() {
  return (
    <DocsLayout eyebrow="Get started" title="Installation">
      <p>
        During the current preview, MCreator Agent installs as a MCreator plugin ZIP. You can
        download the preview ZIP from this site or build the same artifact from source.
      </p>

      <Callout variant="note">
        Current version: <code>1.0.0-2024.4</code>. The validated target is MCreator{" "}
        <code>2024.4.52410</code>.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">Download ZIP</h2>
      <p>
        Download{" "}
        <a
          href={`${import.meta.env.BASE_URL}downloads/MCreator-Agent-1.0.0-2024.4.zip`}
          download
          className="text-primary hover:underline"
        >
          MCreator-Agent-1.0.0-2024.4.zip
        </a>{" "}
        and install it as a MCreator plugin.
      </p>
      <CodeBlock
        language="text"
        code={`SHA-256
2FF2E7115332462B850CEEDA168912E955BD4F17E3FCFDF118E0777ED7B30465`}
      />

      <h2 className="mt-10 text-2xl text-foreground">Before you start</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          Java 21 or newer on your <code>PATH</code>.
        </li>
        <li>MCreator installed (validated against 2024.4).</li>
        <li>An MCreator workspace on disk.</li>
        <li>Bun if you want to run the website locally.</li>
      </ul>
      <Callout variant="note">
        Initial validated support starts with MCreator 2024.4. Version-aware support is designed to
        expand across newer releases as they're validated.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">Build the plugin ZIP</h2>
      <p>Clone the repository, fetch the validated MCreator source tag, and build the plugin:</p>
      <CodeBlock
        language="powershell"
        code={`git clone https://github.com/Nxkoo/MCreator-Agent.git
cd "MCreator-Agent"
git clone --depth 1 --branch 2024.4.52410 https://github.com/MCreator/MCreator.git MCreator
.\\gradlew.bat jar -Pmcreator_path=MCreator --no-daemon`}
      />
      <p>The generated plugin ZIP is written to:</p>
      <CodeBlock language="text" code={`build\\libs\\MCreator Agent.zip`} />

      <h2 className="mt-10 text-2xl text-foreground">Manual install</h2>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>
          Download the preview ZIP above, or copy <code>build\libs\MCreator Agent.zip</code> after
          building from source.
        </li>
        <li>Enable Java plugins in MCreator if needed.</li>
        <li>Restart MCreator and open a workspace.</li>
        <li>Use the MCreator Agent menu/status action to confirm the local MCP endpoint.</li>
      </ol>

      <h2 className="mt-10 text-2xl text-foreground">Windows</h2>
      <p>
        Use the PowerShell commands above. The artifact name contains a space, so keep paths quoted
        when copying or scripting it.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">macOS / Linux</h2>
      <p>
        Use the same source build with{" "}
        <code>./gradlew jar -Pmcreator_path=MCreator --no-daemon</code>. The plugin ZIP path is the
        same: <code>build/libs/MCreator Agent.zip</code>.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">From source</h2>
      <p>To launch MCreator with the plugin loaded directly from the build output:</p>
      <CodeBlock
        language="powershell"
        code={`.\\gradlew.bat runMCreatorWithPlugin -Pmcreator_path=MCreator --no-daemon`}
      />

      <h2 className="mt-10 text-2xl text-foreground">Verify the install</h2>
      <p>
        Open a workspace in MCreator and confirm the MCreator Agent status reports the server as
        running on a local port. The plugin also writes the active port to{" "}
        <code>%USERPROFILE%\.mcreator\mcp\port</code>.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">Common issue</h2>
      <p>
        <strong className="text-foreground">Plugin doesn't load.</strong> Confirm your MCreator
        version is supported and that Java 21+ is in use.
      </p>

      <Callout variant="warning">
        Signed installers are not available yet. MCreator's plugin format is the ZIP artifact shown
        above; installer packaging still needs a separate release decision.
      </Callout>
    </DocsLayout>
  );
}
