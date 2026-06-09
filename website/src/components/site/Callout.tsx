import type { ReactNode } from "react";
import { Info, AlertTriangle, ShieldCheck, Boxes } from "lucide-react";

type Variant = "note" | "warning" | "local" | "geckolib";

const styles: Record<
  Variant,
  { border: string; bg: string; text: string; label: string; Icon: typeof Info }
> = {
  note: {
    border: "border-primary/30",
    bg: "bg-primary/5",
    text: "text-primary",
    label: "NOTE",
    Icon: Info,
  },
  warning: {
    border: "border-warning/30",
    bg: "bg-warning/5",
    text: "text-warning",
    label: "WARNING",
    Icon: AlertTriangle,
  },
  local: {
    border: "border-success/30",
    bg: "bg-success/5",
    text: "text-success",
    label: "LOCAL ONLY",
    Icon: ShieldCheck,
  },
  geckolib: {
    border: "border-primary/30",
    bg: "bg-primary/5",
    text: "text-primary",
    label: "GECKOLIB",
    Icon: Boxes,
  },
};

export function Callout({
  variant = "note",
  title,
  children,
}: {
  variant?: Variant;
  title?: string;
  children: ReactNode;
}) {
  const s = styles[variant];
  const Icon = s.Icon;
  return (
    <div className={`my-5 rounded-md border ${s.border} ${s.bg} p-4`}>
      <div
        className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider ${s.text}`}
      >
        <Icon className="h-3.5 w-3.5" />
        {title ?? s.label}
      </div>
      <div className="mt-2 text-sm text-foreground/90">{children}</div>
    </div>
  );
}
