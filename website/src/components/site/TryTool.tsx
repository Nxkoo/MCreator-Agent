import { useEffect, useMemo, useState } from "react";
import { BrowserFrame } from "./Panel";
import { CopyButton } from "./CopyButton";
import { toast } from "sonner";
import { highlightLines } from "@/lib/highlight";

type ParamType = "string" | "enum" | "number";

type Param = {
  name: string;
  type: ParamType;
  required?: boolean;
  default?: string;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  help?: string;
};

type Preset = {
  id: string;
  label: string;
  description?: string;
  values: Record<string, string>;
};

type Demo = {
  id: string;
  name: string;
  kind: "READ" | "WRITE" | "ACTION" | "GECKOLIB";
  params: Param[];
  presets?: Preset[];
  respond: (args: Record<string, string>) => string[];
};

const KIND_STYLE: Record<Demo["kind"], string> = {
  READ: "border-primary/40 bg-primary/10 text-primary",
  WRITE: "border-warning/40 bg-warning/10 text-warning",
  ACTION: "border-success/40 bg-success/10 text-success",
  GECKOLIB: "border-foreground/30 bg-foreground/5 text-foreground",
};

const DEMOS: Demo[] = [
  {
    id: "getWorkspaceInfo",
    name: "getWorkspaceInfo",
    kind: "READ",
    params: [],
    presets: [{ id: "default", label: "Workspace overview", values: {} }],
    respond: () => [
      "✓ workspace: my-mod",
      "  mcreator: 2024.4",
      "  version: 1.0.0",
      "  author: ExampleAuthor",
      "  elementCount: 42",
      "  workspaceFolder: D:\\mods\\my-mod",
    ],
  },
  {
    id: "listModElements",
    name: "listModElements",
    kind: "READ",
    params: [
      {
        name: "elementType",
        type: "enum",
        default: "item",
        options: ["item", "block", "procedure", "recipe", "animatedentity"],
        help: "Optional MCreator element type filter.",
      },
    ],
    presets: [
      { id: "items", label: "List items", values: { elementType: "item" } },
      { id: "blocks", label: "List blocks", values: { elementType: "block" } },
      { id: "procs", label: "List procedures", values: { elementType: "procedure" } },
      { id: "animated", label: "Animated entities", values: { elementType: "animatedentity" } },
    ],
    respond: (a) => [
      `✓ elements returned${a.elementType ? ` (elementType: ${a.elementType})` : ""}`,
      `  • copper_hammer    type: ${a.elementType || "item"}`,
      `  • tutorial_block   type: block`,
      `  • zombie_warden    type: animatedentity`,
      "  …",
    ],
  },
  {
    id: "buildWorkspace",
    name: "buildWorkspace",
    kind: "ACTION",
    params: [],
    presets: [{ id: "default", label: "Full gradle build", values: {} }],
    respond: () => [
      "→ regenerating code…",
      "→ running gradle build…",
      "✓ build successful in 41.2s",
      "  artifacts: build/libs/my-mod-0.1.jar",
    ],
  },
  {
    id: "getGeckoLibStatus",
    name: "getGeckoLibStatus",
    kind: "GECKOLIB",
    params: [],
    presets: [{ id: "default", label: "Plugin diagnostics", values: {} }],
    respond: () => [
      "✓ plugin detected · GeckoLib Plugin 6.0.2",
      "✓ API available · geckolib",
      "✓ supported types: animatedentity, animateditem, animatedblock, animatedarmor",
      "→ use validateGeckoLibElement for element-level reference checks",
    ],
  },
  {
    id: "validateGeckoLibElement",
    name: "validateGeckoLibElement",
    kind: "GECKOLIB",
    params: [
      {
        name: "elementName",
        type: "string",
        required: true,
        default: "zombie_warden",
        placeholder: "zombie_warden",
        help: "Element name from listModElements.",
      },
    ],
    presets: [
      { id: "warden", label: "Validate warden", values: { elementName: "zombie_warden" } },
      { id: "golem", label: "Validate golem", values: { elementName: "stone_golem" } },
      { id: "custom", label: "Custom", values: { elementName: "my_animated_entity" } },
    ],
    respond: (a) => [
      `✓ target: ${a.elementName}`,
      "✓ GeckoLib plugin/API available",
      "✓ element type supported",
      "▲ missing model reference: warden.geo.json",
      "▲ missing texture reference: entity/zombie_warden.png",
    ],
  },
];

function lineColor(text: string) {
  if (text.startsWith("✓")) return "text-success";
  if (text.startsWith("▲")) return "text-warning";
  if (text.startsWith("→")) return "text-primary";
  return "text-muted-foreground";
}

function defaultsFor(demo: Demo): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of demo.params) out[p.name] = p.default ?? "";
  return out;
}

function validate(demo: Demo, values: Record<string, string>) {
  const errors: Record<string, string> = {};
  for (const p of demo.params) {
    const v = (values[p.name] ?? "").trim();
    if (p.required && !v) {
      errors[p.name] = "Required";
      continue;
    }
    if (!v) continue;
    if (p.type === "enum" && p.options && !p.options.includes(v))
      errors[p.name] = `Must be one of: ${p.options.join(", ")}`;
    if (p.type === "number") {
      const n = Number(v);
      if (!Number.isFinite(n)) errors[p.name] = "Must be a number";
      else if (p.min !== undefined && n < p.min) errors[p.name] = `Min ${p.min}`;
      else if (p.max !== undefined && n > p.max) errors[p.name] = `Max ${p.max}`;
    }
    if (p.type === "string" && v.length > 128) errors[p.name] = "Max 128 characters";
  }
  return errors;
}

function buildRequest(demo: Demo, values: Record<string, string>) {
  const args: Record<string, string | number> = {};
  for (const p of demo.params) {
    const v = (values[p.name] ?? "").trim();
    if (!v) continue;
    args[p.name] = p.type === "number" ? Number(v) : v;
  }
  return JSON.stringify(
    { method: "tools/call", params: { name: demo.name, arguments: args } },
    null,
    2,
  );
}

export function TryTool() {
  const [id, setId] = useState(DEMOS[0].id);
  const demo = DEMOS.find((d) => d.id === id) ?? DEMOS[0];
  const [presetId, setPresetId] = useState<string | null>(demo.presets?.[0]?.id ?? null);
  const [values, setValues] = useState<Record<string, string>>(() => defaultsFor(demo));
  const [submitted, setSubmitted] = useState<Record<string, string>>(() => defaultsFor(demo));

  // Reset when tool changes.
  useEffect(() => {
    const defs = defaultsFor(demo);
    const first = demo.presets?.[0];
    const initial = first ? { ...defs, ...first.values } : defs;
    setValues(initial);
    setSubmitted(initial);
    setPresetId(first?.id ?? null);
  }, [demo]);

  const errors = useMemo(() => validate(demo, values), [demo, values]);
  const hasErrors = Object.keys(errors).length > 0;

  const applyPreset = (p: Preset) => {
    const next = { ...defaultsFor(demo), ...p.values };
    setValues(next);
    setSubmitted(next);
    setPresetId(p.id);
    toast.success(`Preset applied · ${p.label}`);
  };

  const run = () => {
    if (hasErrors) {
      toast.error("Fix the highlighted fields", {
        description: "Validation failed before the request was generated.",
      });
      return;
    }
    setSubmitted({ ...values });
    toast.success("Illustrative request generated", { description: demo.name });
  };

  const request = useMemo(() => buildRequest(demo, submitted), [demo, submitted]);
  const response = useMemo(() => demo.respond(submitted), [demo, submitted]);
  const requestLines = useMemo(() => highlightLines(request, "json"), [request]);

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      {/* Tool picker */}
      <div className="rounded-lg border border-border bg-surface p-3">
        <div className="mb-2 px-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Select a tool
        </div>
        <ul role="listbox" aria-label="MCP tool demos" className="space-y-1">
          {DEMOS.map((d) => {
            const active = d.id === id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setId(d.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded border px-2.5 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "border-primary/50 bg-primary/10"
                      : "border-transparent hover:border-border hover:bg-accent/40"
                  }`}
                >
                  <span
                    className={`font-mono text-[12px] ${active ? "text-primary" : "text-foreground"}`}
                  >
                    {d.name}
                  </span>
                  <span
                    className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${KIND_STYLE[d.kind]}`}
                  >
                    {d.kind}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 px-1 text-[11px] text-muted-foreground">
          Illustrative request / response. Not a live call.
        </p>
      </div>

      {/* Form + demo terminal */}
      <div className="space-y-3">
        {/* Presets */}
        {demo.presets && demo.presets.length > 0 && (
          <div
            role="toolbar"
            aria-label={`Presets for ${demo.name}`}
            className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-2.5"
          >
            <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Presets
            </span>
            {demo.presets.map((p) => {
              const active = presetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  aria-pressed={active}
                  title={p.description ?? p.label}
                  className={`rounded border px-2 py-1 font-mono text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}

        <form
          aria-label={`Parameters for ${demo.name}`}
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Parameters
            </div>
            <button
              type="submit"
              className="rounded border border-primary/50 bg-primary/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Generate request
            </button>
          </div>

          {demo.params.length === 0 ? (
            <p className="font-mono text-[12px] text-muted-foreground">
              This tool takes no parameters.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {demo.params.map((p) => {
                const err = errors[p.name];
                const inputId = `param-${demo.id}-${p.name}`;
                const describedBy = [
                  p.help ? `${inputId}-help` : null,
                  err ? `${inputId}-err` : null,
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div key={p.name} className="flex flex-col gap-1">
                    <label
                      htmlFor={inputId}
                      className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                    >
                      {p.name}
                      {p.required && <span className="ml-1 text-warning">*</span>}
                    </label>
                    {p.type === "enum" ? (
                      <select
                        id={inputId}
                        value={values[p.name] ?? ""}
                        onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
                        aria-invalid={!!err}
                        aria-describedby={describedBy || undefined}
                        className={`rounded border bg-background px-2 py-1.5 font-mono text-[12px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          err ? "border-destructive" : "border-border"
                        }`}
                      >
                        <option value="">—</option>
                        {p.options?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={inputId}
                        type={p.type === "number" ? "number" : "text"}
                        value={values[p.name] ?? ""}
                        placeholder={p.placeholder}
                        onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
                        aria-invalid={!!err}
                        aria-describedby={describedBy || undefined}
                        className={`rounded border bg-background px-2 py-1.5 font-mono text-[12px] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          err ? "border-destructive" : "border-border"
                        }`}
                      />
                    )}
                    {p.help && (
                      <span
                        id={`${inputId}-help`}
                        className="font-mono text-[10px] text-muted-foreground"
                      >
                        {p.help}
                      </span>
                    )}
                    {err && (
                      <span
                        id={`${inputId}-err`}
                        role="alert"
                        className="font-mono text-[10px] text-destructive"
                      >
                        {err}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </form>

        <BrowserFrame title={`mcp · ${demo.name}`} badge="DEMO">
          <div className="bg-[oklch(0.12_0.01_250)]">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                request · json
              </span>
              <CopyButton
                value={request}
                label="Copy request"
                toastLabel={`${demo.name} request JSON`}
              />
            </div>
            <pre
              tabIndex={0}
              className="overflow-x-auto py-3 font-mono text-[12.5px] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <code className="block">
                {requestLines.map((line, i) => (
                  <div key={i} className="flex">
                    <span
                      aria-hidden="true"
                      className="inline-block w-10 shrink-0 select-none pr-3 text-right text-[11px] text-muted-foreground/60"
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 whitespace-pre pr-4">{line}</span>
                  </div>
                ))}
              </code>
            </pre>
            <div className="border-t border-border/40 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              response
            </div>
            <div className="px-4 py-3 font-mono text-[12.5px] leading-[1.7]">
              {response.map((line, i) => (
                <div key={i} className={lineColor(line)}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </BrowserFrame>
      </div>
    </div>
  );
}
