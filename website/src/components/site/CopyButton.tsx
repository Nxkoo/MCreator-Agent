import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CopyButton({
  value,
  label = "Copy",
  className = "",
  toastLabel,
}: {
  value: string;
  label?: string;
  className?: string;
  toastLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: toastLabel ?? label,
      });
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      toast.error("Copy failed", {
        description: err instanceof Error ? err.message : "Your browser blocked clipboard access.",
      });
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied to clipboard" : `Copy ${label.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        copied
          ? "border-success/40 bg-success/10 text-success"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
      } ${className}`}
    >
      {copied ? (
        <Check className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Copy className="h-3 w-3" aria-hidden="true" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
