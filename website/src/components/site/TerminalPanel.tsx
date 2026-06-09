import { BrowserFrame } from "./Panel";

type Line =
  | { kind: "user"; text: string }
  | { kind: "tool"; text: string }
  | { kind: "out"; text: string }
  | { kind: "ok"; text: string }
  | { kind: "info"; text: string }
  | { kind: "warn"; text: string };

const LINES: Line[] = [
  { kind: "user", text: "agent · inspect workspace" },
  { kind: "tool", text: "→ tool/getWorkspaceInfo" },
  { kind: "out", text: "  workspace: my-mod · MCreator 2024.4" },
  { kind: "tool", text: "→ tool/listModElements" },
  { kind: "out", text: "  42 elements returned" },
  { kind: "tool", text: "→ tool/getGeckoLibStatus" },
  { kind: "ok", text: "  ✓ GeckoLib Plugin 6.0.2 detected" },
  { kind: "warn", text: "  ▲ validate zombie_warden: missing model reference" },
  { kind: "info", text: "result: workspace ready, GeckoLib API available, 42 elements indexed" },
];

const COLOR: Record<Line["kind"], string> = {
  user: "text-foreground",
  tool: "text-primary",
  out: "text-muted-foreground",
  ok: "text-success",
  info: "text-foreground/90",
  warn: "text-warning",
};

export function TerminalPanel() {
  return (
    <BrowserFrame title="~/mods/my-mod  ·  mcreator-agent" badge="LIVE MOCK">
      <div className="bg-[oklch(0.12_0.01_250)] px-4 py-4 font-mono text-[12.5px] leading-[1.7]">
        {LINES.map((l, i) => (
          <div key={i} className={COLOR[l.kind]}>
            {l.kind === "user" && <span className="text-primary">$ </span>}
            {l.text}
          </div>
        ))}
        <div className="mt-1 text-primary">
          $ <span className="inline-block h-3.5 w-2 translate-y-0.5 animate-pulse bg-primary" />
        </div>
        <div className="mt-3 border-t border-border/40 pt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          Illustrative UI mockup. Not a screenshot of MCreator.
        </div>
      </div>
    </BrowserFrame>
  );
}
