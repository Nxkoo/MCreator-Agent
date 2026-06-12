import { createFileRoute, Link } from "@tanstack/react-router";
import { Callout } from "@/components/site/Callout";
import { CodeBlock } from "@/components/site/CodeBlock";
import { DocsLayout } from "@/components/site/DocsLayout";

export const Route = createFileRoute("/docs/mcreator-skill")({
  head: () => ({
    meta: [
      { title: "MCreator Skill — MCreator Agent Docs" },
      {
        name: "description",
        content:
          "Technical guide to using MCreator Skill standalone or pairing it with MCreator Agent MCP.",
      },
      { property: "og:title", content: "MCreator Skill — MCreator Agent Docs" },
      {
        property: "og:description",
        content:
          "Agent guidance for safer MCreator editing, generated-code boundaries, GeckoLib workflows, and validation.",
      },
      { property: "og:url", content: "/docs/mcreator-skill" },
    ],
    links: [{ rel: "canonical", href: "/docs/mcreator-skill" }],
  }),
  component: MCreatorSkillDocs,
});

function MCreatorSkillDocs() {
  return (
    <DocsLayout eyebrow="Resources" title="MCreator Skill">
      <p>
        MCreator Skill is a companion skill for AI coding agents. It provides MCreator-specific
        workflow guidance, safe-editing rules, GeckoLib awareness, naming conventions, validation
        expectations, and boundaries for generated code.
      </p>

      <Callout variant="note" title="Product distinction">
        <strong>MCreator Skill</strong> gives agent guidance, workflow rules, context, and safe
        behavior. <strong>MCreator Agent</strong> provides a local MCP server, workspace tools,
        resources, and actions.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">What it is</h2>
      <p>
        The skill is a reusable instruction package for coding agents. It teaches the agent to
        inspect MCreator project structure before editing, prefer MCreator-native approaches,
        identify regeneration risk, keep package boundaries clean, and validate changes with the
        narrowest reliable workflow.
      </p>
      <p>
        It follows the Agent Skills format and can be used by compatible clients without running
        MCreator Agent.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">How it differs from MCreator Agent</h2>
      <p>
        The skill guides the agent's behavior. MCreator Agent provides local MCP tools that can
        inspect and operate on the active MCreator workspace.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-primary">
            MCreator Skill
          </div>
          <p className="mt-2 text-sm text-foreground/90">
            Instructions, decision rules, safety boundaries, context, and reporting expectations.
          </p>
        </div>
        <div className="rounded-md border border-success/30 bg-success/5 p-4">
          <div className="font-mono text-[11px] uppercase tracking-wider text-success">
            MCreator Agent
          </div>
          <p className="mt-2 text-sm text-foreground/90">
            Local MCP tools, active workspace metadata, mod elements, resources, actions, and
            validation loops.
          </p>
        </div>
      </div>

      <h2 className="mt-10 text-2xl text-foreground">When to use it standalone</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>You want an agent to understand MCreator-specific project structure before editing.</li>
        <li>You are working directly in a repository without an active MCreator MCP connection.</li>
        <li>You want safer planning, generated-code boundaries, and explicit validation steps.</li>
        <li>
          Your coding agent supports reusable instructions, skills, or project-level guidance.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">When to pair it with MCreator Agent</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>You want the agent to inspect the workspace currently open in MCreator.</li>
        <li>You want typed tools for workspace metadata, mod elements, resources, and actions.</li>
        <li>You want MCP-assisted regeneration, builds, run targets, or GeckoLib validation.</li>
        <li>You want the guidance layer and local tooling layer working together.</li>
      </ul>
      <Callout variant="local" title="Standalone and MCP">
        Works standalone. Pairs with MCreator Agent.
      </Callout>

      <h2 className="mt-10 text-2xl text-foreground">Installation</h2>
      <p>
        Use your agent's supported skill installation flow. The public skills ecosystem command
        below may be available for compatible clients:
      </p>
      <CodeBlock
        language="bash"
        showLineNumbers={false}
        code="npx skills add Nxkoo/mcreator-skill"
      />
      <Callout variant="warning">
        Confirm the supported install method in the skill repository. Manual installation
        instructions are available on GitHub.
      </Callout>
      <p>For Codex on Windows, the repository documents this user-skill installation:</p>
      <CodeBlock
        language="powershell"
        showLineNumbers={false}
        code={`git clone https://github.com/Nxkoo/mcreator-skill.git "$env:USERPROFILE\\.agents\\skills\\mcreator-ai"`}
      />
      <p>
        You can also clone or download the skill repository and follow its README for
        repository-scoped installation and other Agent Skills-compatible tools.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">Recommended workflow</h2>
      <ol className="list-decimal space-y-2 pl-5">
        <li>Add the skill to your coding agent.</li>
        <li>Open your MCreator project.</li>
        <li>Ask the agent to inspect before editing.</li>
        <li>Require a short plan before changes.</li>
        <li>Keep generated-code boundaries explicit.</li>
        <li>
          Validate with focused tests, regenerate/build, or MCreator Agent MCP tools when available.
        </li>
      </ol>

      <h2 className="mt-10 text-2xl text-foreground">What the skill helps with</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>MCreator workspace inspection and native-first implementation decisions.</li>
        <li>Generated, locked, manual, and resource file classification.</li>
        <li>Lock-aware generated Java changes and clean feature package boundaries.</li>
        <li>Forge, NeoForge, Fabric, Bedrock, and datapack generator awareness.</li>
        <li>GeckoLib asset, model, animation, renderer, and validation safety.</li>
        <li>Post-regeneration review, focused builds, and end-of-task reporting.</li>
      </ul>

      <h2 className="mt-10 text-2xl text-foreground">Scope and safety</h2>
      <p>
        The skill gives guidance. It does not directly access your workspace, run builds, or modify
        files by itself. Actual file edits depend on the agent/client you use. MCP tool access comes
        from MCreator Agent, not from the skill.
      </p>
      <p>
        The skill does not replace MCreator Agent, and MCreator Agent is not required to use the
        skill.
      </p>

      <h2 className="mt-10 text-2xl text-foreground">Repository</h2>
      <p>
        <a
          href="https://github.com/Nxkoo/mcreator-skill"
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          View MCreator Skill on GitHub
        </a>
        . For a product overview, visit the{" "}
        <Link to="/skill" className="text-primary hover:underline">
          MCreator Skill landing page
        </Link>
        .
      </p>
    </DocsLayout>
  );
}
