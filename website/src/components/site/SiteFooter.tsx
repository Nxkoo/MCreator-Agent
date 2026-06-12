import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL}logo.svg`}
              alt="MCreator Agent"
              className="h-7 w-7"
            />
            <span className="font-display italic text-lg">MCreator Agent</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            A local-first MCP server that connects AI agents to MCreator workspaces. Open-source.
            Designed for modding.
          </p>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Crafted by{" "}
            <a
              href="https://github.com/nxkoo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline hover:text-primary transition-colors"
            >
              Nykoo
            </a>{" "}
            · MIT License · Not affiliated with the MCreator project.
          </p>
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Documentation
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <Link to="/docs" className="hover:text-primary">
                Introduction
              </Link>
            </li>
            <li>
              <Link to="/docs/quickstart" className="hover:text-primary">
                Quickstart
              </Link>
            </li>
            <li>
              <Link to="/docs/installation" className="hover:text-primary">
                Installation
              </Link>
            </li>
            <li>
              <Link to="/docs/mcp-clients" className="hover:text-primary">
                MCP Clients
              </Link>
            </li>
            <li>
              <Link to="/docs/mcreator-skill" className="hover:text-primary">
                MCreator Skill
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Reference
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <Link to="/docs/tools" className="hover:text-primary">
                Tools
              </Link>
            </li>
            <li>
              <Link to="/docs/geckolib" className="hover:text-primary">
                GeckoLib
              </Link>
            </li>
            <li>
              <Link to="/docs/architecture" className="hover:text-primary">
                Architecture
              </Link>
            </li>
            <li>
              <Link to="/docs/troubleshooting" className="hover:text-primary">
                Troubleshooting
              </Link>
            </li>
            <li>
              <Link to="/docs/changelog" className="hover:text-primary">
                Changelog
              </Link>
            </li>
            <li>
              <Link to="/docs/release-guide" className="hover:text-primary">
                Release Guide
              </Link>
            </li>
            <li>
              <Link to="/contributing" className="hover:text-primary">
                Contributing
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
