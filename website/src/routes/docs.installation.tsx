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
          "Download the MCreator Agent preview ZIP and install it as a MCreator plugin. Build from source for developer use.",
      },
      { property: "og:title", content: "Installation — MCreator Agent" },
      {
        property: "og:description",
        content:
          "Download the MCreator Agent preview ZIP and install it as a MCreator plugin.",
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
        MCreator Agent installs as a MCreator plugin ZIP. Download the preview ZIP from this site and
        install it directly into MCreator — no extra Java runtime or build tools needed.
      </p>

      <Callout variant="note">
        Current version: <code>1.0.0-2024.4</code>. Initial validated support starts with MCreator{" "}
        <code>2024.4.52410</code>, with version-aware support designed to expand across newer
        releases as they are validated.
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
        and install it as a MCreator plugin using the steps below.
      </p>
      <CodeBlock
        language="text"
        code={`SHA-256
D7B76D38A3D28168E50064C30E8E783CDD461B2EBDF8B00C139C5D18CEF353E7`}
      />

      <h2 className="mt-10 text-2xl text-foreground">Recommended install</h2>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>Download the plugin ZIP above.</li>
        <li>Open MCreator.</li>
        <li>
          Open <strong>Preferences</strong>.
        </li>
        <li>
          Go to <strong>Plugins</strong>.
        </li>
        <li>Enable Java plugins if MCreator asks for it.</li>
        <li>Add or copy the plugin ZIP into MCreator's plugins folder.</li>
        <li>Restart MCreator.</li>
        <li>Open a workspace.</li>
        <li>
          Open the MCreator Agent status/menu action and confirm the local MCP server is running.
        </li>
      </ol>

      <h2 className="mt-10 text-2xl text-foreground">Plugin folder</h2>
      <p>
        If you install manually, place the ZIP in your MCreator plugins folder and restart MCreator.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>Windows:</strong> <code>%USERPROFILE%\.mcreator\plugins</code>
        </li>
        <li>
          <strong>macOS / Linux:</strong> <code>~/.mcreator/plugins</code>
        </li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">Verify the install</h2>
      <p>After restarting MCreator:</p>
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>Open a workspace.</li>
        <li>Look for the MCreator Agent menu/status action.</li>
        <li>Confirm the local MCP endpoint is running.</li>
        <li>
          If the port is not <code>5175</code>, check the port file:
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            <li>
              Windows: <code>%USERPROFILE%\.mcreator\mcp\port</code>
            </li>
            <li>
              macOS / Linux: <code>~/.mcreator/mcp/port</code>
            </li>
          </ul>
        </li>
      </ol>

      <Callout variant="warning">
        Signed installers are not available yet. The MCreator plugin ZIP is the distribution format
        for this preview.
      </Callout>

      <hr className="my-10 border-border" />

      <h2 className="mt-10 text-2xl text-foreground">Advanced: build from source</h2>
      <p>
        Most users do not need this. Use it only if you are developing MCreator Agent or want to build
        the plugin yourself.
      </p>

      <Callout variant="note">
        Java 21+ is required when building from source. It is not part of the normal plugin
        installation flow for end users.
      </Callout>

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

      <h3 className="mt-6 text-xl text-foreground">macOS / Linux</h3>
      <p>
        Use the same source build with{" "}
        <code>./gradlew jar -Pmcreator_path=MCreator --no-daemon</code>. The plugin ZIP path is the
        same: <code>build/libs/MCreator Agent.zip</code>.
      </p>

      <h3 className="mt-6 text-xl text-foreground">Run from source</h3>
      <p>To launch MCreator with the plugin loaded directly from the build output:</p>
      <CodeBlock
        language="powershell"
        code={`.\\gradlew.bat runMCreatorWithPlugin -Pmcreator_path=MCreator --no-daemon`}
      />
    </DocsLayout>
  );
}
