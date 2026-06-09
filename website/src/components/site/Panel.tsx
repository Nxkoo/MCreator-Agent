import type { ReactNode } from "react";

export function BrowserFrame({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-[0_30px_80px_-40px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-3 border-b border-border/70 bg-surface-2/60 px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex-1 truncate font-mono text-[11px] text-muted-foreground">{title}</div>
        {badge && (
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="h-px w-8 bg-primary/50" />
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
        {children}
      </span>
    </div>
  );
}
