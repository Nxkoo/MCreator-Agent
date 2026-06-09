import { createFileRoute, Link } from "@tanstack/react-router";
import { DocsLayout } from "@/components/site/DocsLayout";
import { CodeBlock } from "@/components/site/CodeBlock";
import { Callout } from "@/components/site/Callout";

export const Route = createFileRoute("/contributing")({
  head: () => ({
    meta: [
      { title: "Contributing on GitHub — MCreator Agent" },
      {
        name: "description",
        content: "Fork the repo, open a PR, and run the MCreator Agent site locally.",
      },
      { property: "og:title", content: "Contributing — MCreator Agent" },
      { property: "og:description", content: "How to fork, PR, and run this site locally." },
      { property: "og:url", content: "/contributing" },
    ],
    links: [{ rel: "canonical", href: "/contributing" }],
  }),
  component: Contributing,
});

const CLONE = `# replace YOUR-USER with your GitHub handle
git clone https://github.com/YOUR-USER/MCreator-Agent.git
cd MCreator-Agent`;

const INSTALL = `# install website dependencies
cd website
bun install`;

const DEV = `# start the dev server (http://localhost:5173)
bun run dev`;

const BUILD = `# production build + preview
bun run build
bun run preview`;

const BRANCH = `git checkout -b feat/short-description`;

const COMMIT = `git add -A
git commit -m "feat(docs): improve quickstart wording"
git push origin feat/short-description`;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-lg border border-border bg-surface/60 p-4">
      <div className="flex items-baseline gap-3">
        <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
          step {n}
        </span>
        <h2 className="text-xl text-foreground">{title}</h2>
      </div>
      <div className="mt-3 space-y-3 text-sm text-foreground/90">{children}</div>
    </section>
  );
}

function Contributing() {
  return (
    <DocsLayout eyebrow="Open source" title="Contributing on GitHub">
      <p>
        MCreator Agent is open source under MIT. This page is the quickest path from a clean
        checkout to an open pull request, plus how to run the documentation site itself on your
        machine.
      </p>

      <Callout variant="note">
        Looking for installation instead of contribution setup? See{" "}
        <Link to="/docs/installation" className="text-primary hover:underline">
          Installation
        </Link>{" "}
        and{" "}
        <Link to="/docs/architecture" className="text-primary hover:underline">
          Architecture
        </Link>
        .
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">Fork & clone</h2>

      <Step n={1} title="Fork the repository">
        <p>
          Open the repo on GitHub and click <strong className="text-foreground">Fork</strong> in the
          top-right. Choose your own account or an org you maintain.
        </p>
      </Step>

      <Step n={2} title="Clone your fork">
        <CodeBlock language="bash" code={CLONE} />
        <p className="text-muted-foreground">
          Adds your fork as the <code>origin</code> remote automatically.
        </p>
      </Step>

      <Step n={3} title="Install dependencies">
        <CodeBlock language="bash" code={INSTALL} />
        <p className="text-muted-foreground">
          Node 20+ is recommended for the website. Java 21+ is required for the plugin build.
        </p>
      </Step>

      <h2 className="mt-12 text-2xl text-foreground">Run the site locally</h2>

      <Step n={4} title="Start the dev server">
        <CodeBlock language="bash" code={DEV} />
        <p className="text-muted-foreground">
          Hot-reload runs at <code>http://localhost:5173</code>. From the repo root, the website
          files live under <code>website/src/routes</code> and <code>website/src/components</code>.
        </p>
      </Step>

      <Step n={5} title="Try a production build">
        <CodeBlock language="bash" code={BUILD} />
        <p className="text-muted-foreground">
          Verifies SSR + bundling before opening a PR. Catches missing meta tags and broken routes.
        </p>
      </Step>

      <h2 className="mt-12 text-2xl text-foreground">Open a pull request</h2>

      <Step n={6} title="Branch from main">
        <CodeBlock language="bash" code={BRANCH} />
        <p className="text-muted-foreground">
          Use a short, descriptive name. Prefix with <code>feat/</code>, <code>fix/</code>,{" "}
          <code>docs/</code>, or <code>chore/</code>.
        </p>
      </Step>

      <Step n={7} title="Commit and push">
        <CodeBlock language="bash" code={COMMIT} />
        <p className="text-muted-foreground">
          Conventional Commits is preferred but not required — clarity matters more than style.
        </p>
      </Step>

      <Step n={8} title="Open the PR">
        <p>
          On GitHub, your fork now offers{" "}
          <strong className="text-foreground">Compare & pull request</strong>. Target{" "}
          <code>main</code> on the upstream repo and fill the template:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>What changed and why</li>
          <li>Screenshots for UI changes</li>
          <li>Validation steps you ran (build, screenshot, link check)</li>
          <li>Linked issue, if any</li>
        </ul>
      </Step>

      <Callout variant="local">
        Be patient and kind in review. We prefer small, focused PRs — a doc fix, a single page, or a
        single component — over sweeping refactors.
      </Callout>

      <h2 className="mt-12 text-2xl text-foreground">Where to find things</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <code>website/src/routes/</code> — every doc page is one file (TanStack file-based
          routing).
        </li>
        <li>
          <code>website/src/components/site/</code> — shared site components (Header, Footer,
          DocsLayout, CodeBlock, …).
        </li>
        <li>
          <code>website/src/styles.css</code> — design tokens (colors, typography, surfaces).
        </li>
        <li>
          <code>website/src/routes/docs.changelog.tsx</code> — the published changelog.
        </li>
        <li>
          See the{" "}
          <Link to="/docs/release-guide" className="text-primary hover:underline">
            Release Guide
          </Link>{" "}
          for how version cuts work.
        </li>
      </ul>
    </DocsLayout>
  );
}
