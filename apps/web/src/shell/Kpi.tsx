import * as React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";

/**
 * Prototype KPI card (Front_end/css/app.css .kpi): white surface, hairline
 * border, and a 3px colored LEFT accent edge (status class picks the color),
 * 11.5px gray label, 22px tabular-numeric value, small delta line with
 * green/red arrows. Rendered in a responsive auto-fit row.
 */
export type KpiTone = "primary" | "ok" | "warn" | "err" | "info";

const TONE_EDGE: Record<KpiTone, string> = {
  primary: "#3F51B5",
  ok: "#107C10",
  warn: "#F7630C",
  err: "#C50F1F",
  info: "#5C6BC0",
};

export function Kpi(props: {
  label: string;
  value: React.ReactNode;
  tone?: KpiTone;
  delta?: { dir: "up" | "dn" | "flat"; text: string };
  onClick?: () => void;
}) {
  const { label, value, tone = "primary", delta, onClick } = props;
  return (
    <Paper
      {...(onClick ? { component: "button" as const, onClick } : {})}
      elevation={0}
      sx={{
        position: "relative", textAlign: "left", overflow: "hidden",
        border: "1px solid", borderColor: "divider", borderRadius: 1,
        px: 2, py: 1.5, minWidth: 0, width: "100%",
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { borderColor: "primary.main", boxShadow: 1 } : undefined,
        "&::after": {
          content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: TONE_EDGE[tone],
        },
      }}
    >
      <Box sx={{ fontSize: 11.5, fontWeight: 500, color: "text.secondary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </Box>
      <Box sx={{
        fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em", my: 0.25,
        fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {value}
      </Box>
      {delta && (
        <Box sx={{
          fontSize: 11, color: "text.secondary",
          "& b": { fontWeight: 600 },
        }}>
          <Box component="span" sx={{
            color: delta.dir === "up" ? "#107C10" : delta.dir === "dn" ? "#C50F1F" : "text.secondary",
            fontWeight: 600, mr: 0.5,
          }}>
            {delta.dir === "up" ? "▲" : delta.dir === "dn" ? "▼" : "—"}
          </Box>
          {delta.text}
        </Box>
      )}
    </Paper>
  );
}

/** Responsive KPI strip — prototype .kpiRow (auto-fit min 168px). */
export function KpiRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{
      display: "grid", gap: 1.5, mb: 2,
      gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))",
    }}>
      {children}
    </Box>
  );
}

/**
 * Prototype status chips (app.css .chip-ok/.chip-warn/.chip-bad/.chip):
 * soft tinted fill + bold status word — used for KYC, return filing states,
 * application stages, anything the prototype renders as a chip.
 */
const CHIP_TONE: Record<string, "success" | "warning" | "error" | "default" | "info"> = {
  ok: "success",
  warn: "warning",
  bad: "error",
  info: "info",
  neutral: "default",
};

export function StatusChip(props: {
  tone: keyof typeof CHIP_TONE;
  label: string;
  size?: "small" | "medium";
}) {
  const { tone, label, size = "small" } = props;
  return (
    <Chip
      size={size}
      label={label}
      color={CHIP_TONE[tone]}
      variant="filled"
      sx={{ fontWeight: 600 }}
    />
  );
}

/** Map an arbitrary status word to a chip tone using the prototype's groups. */
export function statusTone(status: string): keyof typeof CHIP_TONE {
  const s = status.toLowerCase();
  if (/(verified|clear|filed|passed|approved|active|current|good|ok|done|submitted|healthy|st-?0)/.test(s)) return "ok";
  if (/(pending|watch|review|in progress|staged|draft|sma|caution|aging|attention)/.test(s)) return "warn";
  if (/(reject|declin|fail|overdue|blocked|bad|loss|doubtful|substandard|default|breach|expired)/.test(s)) return "bad";
  if (/(info|new|opened)/.test(s)) return "info";
  return "neutral";
}
