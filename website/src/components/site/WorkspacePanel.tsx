import {
  File,
  FolderOpen,
  Folder,
  FileCode2,
  FileJson,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { BrowserFrame } from "./Panel";

const tree = [
  { type: "dir-open", name: "my-mod", depth: 0 },
  { type: "dir-open", name: "src/main", depth: 1 },
  { type: "dir", name: "elements", depth: 2 },
  { type: "dir", name: "procedures", depth: 2 },
  { type: "dir-open", name: "assets", depth: 2 },
  { type: "file-img", name: "zombie_warden.png", depth: 3 },
  { type: "file-img", name: "warden_axe.png", depth: 3 },
  { type: "dir", name: "animations", depth: 3, hint: "geckolib" },
  { type: "file-code", name: "workspace.mcreator", depth: 1 },
  { type: "file-json", name: "build.gradle", depth: 1 },
] as const;

function Icon({ t }: { t: string }) {
  const cls = "h-3.5 w-3.5";
  if (t === "dir-open") return <FolderOpen className={`${cls} text-primary`} />;
  if (t === "dir") return <Folder className={`${cls} text-muted-foreground`} />;
  if (t === "file-img") return <ImageIcon className={`${cls} text-warning`} />;
  if (t === "file-code") return <FileCode2 className={`${cls} text-primary`} />;
  if (t === "file-json") return <FileJson className={`${cls} text-muted-foreground`} />;
  return <File className={cls} />;
}

export function WorkspacePanel() {
  return (
    <BrowserFrame title="workspace.mcreator  ·  illustrative view" badge="UI MOCK">
      <div className="grid grid-cols-12 bg-[oklch(0.14_0.01_250)]">
        <div className="col-span-5 border-r border-border/60 px-3 py-3 font-mono text-[12px]">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            Workspace
          </div>
          {tree.map((n, i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-0.5 text-foreground/90"
              style={{ paddingLeft: n.depth * 12 }}
            >
              <Icon t={n.type} />
              <span className="truncate">{n.name}</span>
              {"hint" in n && n.hint && (
                <span className="ml-auto rounded border border-primary/30 bg-primary/5 px-1 py-0 text-[9px] uppercase tracking-wider text-primary">
                  {n.hint}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="col-span-7 space-y-2 px-4 py-3">
          <div className="rounded-md border border-border bg-surface px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                element · zombie_warden
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-success/30 bg-success/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success">
                <CheckCircle2 className="h-3 w-3" /> validated
              </span>
            </div>
            <div className="mt-2 font-mono text-[12px] text-foreground/90">
              <div>
                <span className="text-muted-foreground">type</span> ={" "}
                <span className="text-primary">animatedentity</span>
              </div>
              <div>
                <span className="text-muted-foreground">health</span> = 60
              </div>
              <div>
                <span className="text-muted-foreground">model</span> = "warden.geo.json"
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface px-3 py-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                geckolib · reference validation
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-warning/30 bg-warning/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-warning">
                <AlertTriangle className="h-3 w-3" /> 1 notice
              </span>
            </div>
            <div className="mt-2 font-mono text-[12px] text-muted-foreground">
              missing model reference:{" "}
              <span className="text-warning">models/entity/warden.geo.json</span>
            </div>
          </div>

          <div className="rounded-md border border-border bg-surface px-3 py-2.5 font-mono text-[11px] text-muted-foreground">
            <div className="mb-1 uppercase tracking-wider text-foreground/80">agent suggestion</div>
            Import the missing model file, then rerun validateGeckoLibElement before building.
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
