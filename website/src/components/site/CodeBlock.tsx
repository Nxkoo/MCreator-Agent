import { CopyButton } from "./CopyButton";
import { highlightLines } from "@/lib/highlight";

export function CodeBlock({
  code,
  language = "bash",
  filename,
  showLineNumbers = true,
}: {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
}) {
  const lines = highlightLines(code, language);
  return (
    <div className="my-5 max-w-full overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-surface-2/50 px-3 py-1.5">
        <span className="truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {filename ?? language}
        </span>
        <CopyButton value={code} />
      </div>
      <pre
        tabIndex={0}
        className="max-w-full overflow-x-auto px-0 py-3 font-mono text-[13px] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <code className="block min-w-full">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              {showLineNumbers && (
                <span
                  aria-hidden="true"
                  className="sticky left-0 inline-block w-10 shrink-0 select-none bg-surface pr-3 text-right font-mono text-[11px] leading-relaxed text-muted-foreground/60"
                >
                  {i + 1}
                </span>
              )}
              <span className="min-w-0 flex-1 whitespace-pre pl-3 pr-4">{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
