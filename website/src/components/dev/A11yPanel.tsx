import { useEffect, useState } from "react";
import { Accessibility, X, Check, AlertTriangle } from "lucide-react";

type Check = { label: string; status: "pass" | "warn" | "fail"; detail?: string };

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function runChecks(): Check[] {
  const checks: Check[] = [];

  // 1. Tab order: tabIndex > 0 is an anti-pattern.
  const positive = Array.from(document.querySelectorAll<HTMLElement>("[tabindex]")).filter(
    (el) => Number(el.getAttribute("tabindex")) > 0,
  );
  checks.push({
    label: "No tabindex > 0",
    status: positive.length === 0 ? "pass" : "fail",
    detail: positive.length
      ? `${positive.length} element(s) override DOM tab order`
      : "DOM order drives focus",
  });

  // 2. Skip-to-content link exists.
  const skip = document.querySelector('a[href="#main-content"]');
  checks.push({
    label: "Skip-to-content link",
    status: skip ? "pass" : "fail",
    detail: skip ? "First focusable on Tab" : "Missing — add SkipLink in root",
  });

  // 3. Single <main> landmark.
  const mains = document.querySelectorAll("main");
  checks.push({
    label: "Single <main> landmark",
    status: mains.length === 1 ? "pass" : "fail",
    detail: `${mains.length} found`,
  });

  // 4. Open dialog has aria-modal & focusable content.
  const dialog = document.querySelector(
    '[role="dialog"][aria-modal="true"], [data-state="open"][role="dialog"]',
  ) as HTMLElement | null;
  if (dialog) {
    const focusable = dialog.querySelectorAll(FOCUSABLE).length;
    checks.push({
      label: "Open dialog: focus trap candidates",
      status: focusable >= 1 ? "pass" : "warn",
      detail: `${focusable} focusable inside`,
    });
    const labelled = dialog.getAttribute("aria-label") || dialog.getAttribute("aria-labelledby");
    checks.push({
      label: "Open dialog: accessible name",
      status: labelled ? "pass" : "warn",
      detail: labelled ? "labelled" : "Add aria-label / aria-labelledby",
    });
  } else {
    checks.push({ label: "No open dialog", status: "pass", detail: "Open one to test trap & Esc" });
  }

  // 5. Icon-only buttons missing accessible names.
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
  const unnamed = buttons.filter((b) => {
    const text = (b.textContent ?? "").trim();
    const label = b.getAttribute("aria-label");
    const labelledby = b.getAttribute("aria-labelledby");
    return !text && !label && !labelledby;
  });
  checks.push({
    label: "Buttons have accessible names",
    status: unnamed.length === 0 ? "pass" : "warn",
    detail: unnamed.length ? `${unnamed.length} unnamed` : "All labelled",
  });

  // 6. Images have alt attributes.
  const imgs = Array.from(document.querySelectorAll("img"));
  const missingAlt = imgs.filter((i) => !i.hasAttribute("alt"));
  checks.push({
    label: "Images have alt",
    status: missingAlt.length === 0 ? "pass" : "warn",
    detail: `${imgs.length} images · ${missingAlt.length} missing alt`,
  });

  return checks;
}

export function A11yPanel() {
  const [open, setOpen] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [escCount, setEscCount] = useState(0);

  // Refresh checks when opening, on route/DOM changes, and after Esc presses.
  useEffect(() => {
    if (!open) return;
    setChecks(runChecks());
    const obs = new MutationObserver(() => setChecks(runChecks()));
    obs.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => obs.disconnect();
  }, [open, escCount]);

  // Track Esc presses to verify modals close on Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEscCount((n) => n + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const tone = (s: Check["status"]) =>
    s === "pass"
      ? "border-success/40 bg-success/10 text-success"
      : s === "warn"
        ? "border-warning/40 bg-warning/10 text-warning"
        : "border-destructive/40 bg-destructive/10 text-destructive";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close accessibility check panel" : "Open accessibility check panel"}
        aria-pressed={open}
        className="fixed bottom-4 left-4 z-[90] inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-background/90 text-primary shadow-lg backdrop-blur transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        title="Dev: a11y checks"
      >
        <Accessibility className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <aside
          role="region"
          aria-label="Accessibility checks (development)"
          className="fixed bottom-16 left-4 z-[90] w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-background/95 p-3 shadow-2xl backdrop-blur"
        >
          <header className="flex items-center justify-between gap-2 border-b border-border pb-2">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <Accessibility className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              a11y · dev only
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setChecks(runChecks())}
                className="rounded border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Recheck
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close panel"
                className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </header>

          <ul className="mt-2 space-y-1.5">
            {checks.map((c, i) => (
              <li
                key={i}
                className={`flex items-start gap-2 rounded border px-2 py-1.5 text-[11px] ${tone(c.status)}`}
              >
                {c.status === "pass" ? (
                  <Check className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                )}
                <div className="min-w-0">
                  <div className="font-mono">{c.label}</div>
                  {c.detail && <div className="text-foreground/70">{c.detail}</div>}
                </div>
              </li>
            ))}
          </ul>

          <footer className="mt-2 border-t border-border pt-2 font-mono text-[10px] text-muted-foreground">
            Esc presses observed: {escCount} · Press Tab to walk focus order ·{" "}
            <span className="text-foreground/60">Visible in dev only.</span>
          </footer>
        </aside>
      )}
    </>
  );
}
