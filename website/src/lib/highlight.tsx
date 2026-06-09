import type { ReactNode } from "react";

type Token = { type: string; value: string };

const COLOR: Record<string, string> = {
  keyword: "text-[oklch(0.78_0.16_295)]",
  string: "text-[oklch(0.82_0.14_140)]",
  number: "text-[oklch(0.82_0.16_60)]",
  boolean: "text-[oklch(0.78_0.18_30)]",
  null: "text-muted-foreground italic",
  punct: "text-muted-foreground",
  prop: "text-primary",
  comment: "text-muted-foreground italic",
  command: "text-[oklch(0.78_0.16_295)]",
  flag: "text-[oklch(0.82_0.16_60)]",
  variable: "text-[oklch(0.82_0.14_140)]",
  text: "text-foreground/90",
};

function tokenize(code: string, language: string): Token[] {
  const lang = language.toLowerCase();
  if (lang === "json") return tokenizeJson(code);
  if (lang === "bash" || lang === "sh" || lang === "shell") return tokenizeShell(code, "bash");
  if (lang === "powershell" || lang === "ps1") return tokenizeShell(code, "ps");
  return [{ type: "text", value: code }];
}

function tokenizeJson(code: string): Token[] {
  const out: Token[] = [];
  const re =
    /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}[\],])|(\s+)|([^\s{}[\],]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    if (m[1]) {
      out.push({ type: m[2] ? "prop" : "string", value: m[1] });
      if (m[2]) out.push({ type: "punct", value: m[2] });
    } else if (m[3]) out.push({ type: "number", value: m[3] });
    else if (m[4]) out.push({ type: "boolean", value: m[4] });
    else if (m[5]) out.push({ type: "null", value: m[5] });
    else if (m[6]) out.push({ type: "punct", value: m[6] });
    else if (m[7]) out.push({ type: "text", value: m[7] });
    else if (m[8]) out.push({ type: "text", value: m[8] });
  }
  return out;
}

function tokenizeShell(code: string, kind: "bash" | "ps"): Token[] {
  const out: Token[] = [];
  const re =
    /(#[^\n]*|<#[\s\S]*?#>)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\$[A-Za-z_][\w]*|\$\{[^}]+\})|(--?[A-Za-z][\w-]*)|(\b\d+(?:\.\d+)?\b)|(\b(?:curl|Invoke-RestMethod|sudo|cd|cp|mv|rm|ls|cat|echo|export|set|if|then|fi|for|do|done|while|function|param)\b)|(\s+)|([^\s]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    if (m[1]) out.push({ type: "comment", value: m[1] });
    else if (m[2]) out.push({ type: "string", value: m[2] });
    else if (m[3]) out.push({ type: "variable", value: m[3] });
    else if (m[4]) out.push({ type: "flag", value: m[4] });
    else if (m[5]) out.push({ type: "number", value: m[5] });
    else if (m[6]) out.push({ type: kind === "ps" ? "command" : "command", value: m[6] });
    else if (m[7]) out.push({ type: "text", value: m[7] });
    else if (m[8]) out.push({ type: "text", value: m[8] });
  }
  return out;
}

export function highlight(code: string, language = "text"): ReactNode {
  const tokens = tokenize(code, language);
  return tokens.map((t, i) => (
    <span key={i} className={COLOR[t.type] ?? COLOR.text}>
      {t.value}
    </span>
  ));
}

export function highlightLines(code: string, language = "text"): ReactNode[] {
  const lines = code.split("\n");
  return lines.map((line, i) => <span key={i}>{highlight(line, language)}</span>);
}
