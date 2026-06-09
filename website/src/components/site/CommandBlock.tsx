import { Check, Copy } from "lucide-react";
import { useState } from "react";

type Tab = { id: string; label: string; command: string; note?: string };

export function CommandBlock({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0].id);
  const [copied, setCopied] = useState(false);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border/70 bg-surface-2/50 px-3 py-2">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition ${
                t.id === active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition ${
            copied
              ? "border-success/40 bg-success/10 text-success"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
          }`}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-sm leading-relaxed text-foreground">
        <code>
          <span className="text-primary">$</span> {current.command}
        </code>
      </pre>
      {current.note && (
        <div className="border-t border-border/70 px-4 py-2 font-mono text-[11px] text-muted-foreground">
          {current.note}
        </div>
      )}
    </div>
  );
}
