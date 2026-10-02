import * as React from "react";
import {
  Box, Button, Chip, Table, TableHead, TableRow, TableCell, TableBody,
  Typography, Alert, CircularProgress,
} from "@mui/material";
import { pullCib, getCib, getScore, type CibDetailView, type ScoreView } from "../../api/assessments";
import { formatTk } from "../../api/money";

/**
 * Assessment panel (PLANNING/03 mod-assessment, 12 W7-F "CIB viewer"):
 * latest score + server DBR, bureau pull button, parsed facility table.
 * Shown in the pipeline detail for CIB_PULL/SCORING/CPV/APPROVAL stages.
 */
export function AssessmentPanel({ appId, cif }: { appId: string; cif?: string }) {
  const [score, setScore] = React.useState<ScoreView | null>(null);
  const [cib, setCib] = React.useState<CibDetailView | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      setScore(await getScore(appId).catch(() => null));
      if (cif) setCib(await getCib(cif).catch(() => null));
    } catch { /* panel is best-effort */ }
  }, [appId, cif]);
  React.useEffect(() => { void refresh(); }, [refresh]);

  async function onPull() {
    if (!cif) return;
    setBusy(true); setError(null);
    try {
      await pullCib(cif);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="subtitle2">Assessment</Typography>
        {score ? (<>
          <Chip size="small" color="primary" label={`Score ${score.score} · Grade ${score.grade} (v${score.version})`} />
          <Chip size="small" color={
            score.decision === "AUTO_PASS" ? "success"
              : score.decision === "AUTO_DECLINE" ? "error" : "warning"
          } label={score.decision} />
          {score.dbrPercent && <Chip size="small" variant="outlined" label={`DBR ${score.dbrPercent}%`} />}
        </>) : (
          <Chip size="small" variant="outlined" label="no score yet" />
        )}
        {cif && (
          <Button size="small" variant="outlined" disabled={busy} onClick={onPull} sx={{ ml: "auto" }}>
            {busy ? <CircularProgress size={14} /> : "Pull CIB report"}
          </Button>
        )}
      </Box>
      {error && <Alert severity="error">{error}</Alert>}

      {cib && (
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Lender</TableCell><TableCell>Type</TableCell>
            <TableCell>Outstanding</TableCell><TableCell>Overdue</TableCell>
            <TableCell>Installment</TableCell><TableCell>DPD</TableCell><TableCell>Class</TableCell>
            <TableCell>24m track</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {cib.facilities.map((f, i) => (
              <TableRow key={i}>
                <TableCell>{f.lenderName ?? f.lenderCode}</TableCell>
                <TableCell>{f.facilityType}</TableCell>
                <TableCell>{formatTk(f.outstandingMinor ?? 0)}</TableCell>
                <TableCell>{formatTk(f.overdueMinor ?? 0)}</TableCell>
                <TableCell>{formatTk(f.installmentMinor ?? 0)}</TableCell>
                <TableCell>{f.dpd}</TableCell>
                <TableCell>
                  <Chip size="small" label={f.classification}
                    color={f.classification === "STD-0" ? "success"
                      : f.classification === "SMA" ? "warning" : "error"} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{
                    fontFamily: "monospace", fontSize: 10, letterSpacing: 0.5,
                    color: /[12]/.test(f.repaymentTrack ?? "") ? "error.main" : "success.main",
                  }}>
                    {(f.repaymentTrack ?? "").replace(/0/g, "·").replace(/[12]/g, "▮")}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {cib && (
        <Typography variant="caption" color="text.secondary">
          CIB period {cib.period} · pulled {new Date(cib.pulledAt).toLocaleString()}
          {cib.pullHistory?.length ? ` · ${cib.pullHistory.length} pull(s) on record` : ""}
        </Typography>
      )}
    </Box>
  );
}
