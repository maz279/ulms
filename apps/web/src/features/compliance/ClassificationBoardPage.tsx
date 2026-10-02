import * as React from "react";
import {
  Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button,
  Box, Chip, Alert, CircularProgress,
} from "@mui/material";
import { getBoard, runEod, classifyLocal, postProvisionJv, type BoardData } from "../../api/compliance";
import { formatTk } from "../../api/money";
import { useLang, t } from "../../i18n/bilingual";
import { PageHeader } from "../../shell/PageHeader";
import { Kpi, KpiRow } from "../../shell/Kpi";

/**
 * BRPD 15/2024 classification board (03 mod-compliance, 12 W8-F): per-class
 * summary, provision totals, portfolio table, EOD trigger, open STR alerts,
 * and the provision JV to the Fineract GL (03 "JV queue", prototype button).
 * The provision column uses the FRONTEND mirror of the matrix; parity with
 * the backend oracle endpoint is asserted by the e2e suite.
 */
export function ClassificationBoardPage() {
  useLang();   // re-render the chrome on language toggle
  const [board, setBoard] = React.useState<BoardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try { setBoard(await getBoard()); } catch (e) { setError(String(e)); }
  }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);

  async function onRunEod() {
    setBusy(true); setError(null);
    try { await runEod(); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  /** Post the latest run's provision total to the Fineract GL (03 JV queue). */
  async function onPostJv() {
    setBusy(true); setError(null); setNotice(null);
    try {
      const jv = await postProvisionJv(board?.latestRun?.runDate);
      setNotice(`Provision JV ${jv.referenceNumber} posted — zero-sum ${formatTk(jv.totalMinor)} · Fineract txn ${jv.fineractTxnId}`);
    }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  if (!board) return busy ? <CircularProgress /> : <Typography>Loading board…</Typography>;

  const byClass = new Map<string, { count: number; provision: number }>();
  for (const loan of board.loans) {
    const rateBp = classifyLocal(loan.dpd).rateBp;
    const provision = Math.round((loan.outstandingMinor * rateBp) / 10000);
    const e = byClass.get(loan.classification) ?? { count: 0, provision: 0 };
    e.count += 1; e.provision += provision;
    byClass.set(loan.classification, e);
  }

  const totalProvision = [...byClass.values()].reduce((s, e) => s + e.provision, 0);
  const totalOutstanding = board.loans.reduce((s, l) => s + l.outstandingMinor, 0);
  const npa = board.loans.filter((l) => ["SS", "DF", "BL"].includes(l.classification)).length;

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <PageHeader
        crumbs={[{ label: "Insight & Compliance" }, { label: t("nav.compliance.board") }]}
        title={t("compliance.board.title")}
        sub="BRPD 15/2024 seven-stage classification · daily EOD · provisioning GLs"
        badge={board.latestRun ? `EOD ${board.latestRun.runDate}` : "no run yet"}
        actions={
          <>
            <Button variant="outlined" size="small" disabled={busy || !board.latestRun} onClick={onPostJv}>
              Provision JV
            </Button>
            <Button variant="contained" size="small" disabled={busy} onClick={onRunEod}>
              {busy ? <CircularProgress size={16} /> : "Run EOD now"}
            </Button>
          </>
        }
      />
      <KpiRow>
        <Kpi tone="primary" label="Open loans" value={board.loans.length} />
        <Kpi tone="ok" label="Standard book" value={board.loans.filter((l) => l.classification.startsWith("STD")).length} />
        <Kpi tone="err" label="NPA (SS·DF·BL)" value={npa}
          delta={{ dir: "flat", text: `${board.loans.length ? ((npa / board.loans.length) * 100).toFixed(1) : "0"}% of count` }} />
        <Kpi tone="warn" label="Provision required" value={formatTk(totalProvision, { full: true })}
          delta={{ dir: "flat", text: `on ${formatTk(totalOutstanding, { full: true })} outstanding` }} />
      </KpiRow>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="success">{notice}</Alert>}

      {board.latestRun && (
        <Alert severity="info">
          Latest EOD {board.latestRun.runDate} — {board.latestRun.loansClassified} loans ·
          outstanding {formatTk(board.latestRun.totalOutstandingMinor, { full: true })} ·
          provision {formatTk(board.latestRun.totalProvisionMinor, { full: true })}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {["STD-0", "STD-1", "STD-2", "SMA", "SS", "DF", "B/L"].map((cls) => {
          const e = byClass.get(cls);
          return (
            <Paper key={cls} variant="outlined" sx={{ p: 1.5, minWidth: 130 }}>
              <Chip size="small" label={cls} color={
                cls.startsWith("STD") ? "success" : cls === "SMA" ? "warning" : "error"
              } />
              <Typography variant="h6" sx={{ mt: 0.5 }}>{e?.count ?? 0}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatTk(e?.provision ?? 0)} provision
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {board.openAlerts.length > 0 && (
        <Alert severity="warning">
          {board.openAlerts.length} open compliance alert(s) — {board.openAlerts[0].type}
          {" "}· STR cash-threshold disbursements require review.
        </Alert>
      )}

      <Paper variant="outlined">
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Loan</TableCell><TableCell>DPD</TableCell><TableCell>Classification</TableCell>
            <TableCell>Rate</TableCell><TableCell>Outstanding</TableCell>
            <TableCell>Provision</TableCell><TableCell>Interest suspense</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {board.loans.map((loan) => {
              const rateBp = classifyLocal(loan.dpd).rateBp;
              return (
                <TableRow key={loan.id} hover>
                  <TableCell sx={{ fontFamily: "monospace" }}>{loan.loanNo}</TableCell>
                  <TableCell>{loan.dpd}</TableCell>
                  <TableCell><Chip size="small" label={loan.classification}
                    color={loan.classification.startsWith("STD") ? "success"
                      : loan.classification === "SMA" ? "warning" : "error"} /></TableCell>
                  <TableCell>{rateBp / 100}%</TableCell>
                  <TableCell>{formatTk(loan.outstandingMinor)}</TableCell>
                  <TableCell>{formatTk(Math.round((loan.outstandingMinor * rateBp) / 10000))}</TableCell>
                  <TableCell>{loan.interestSuspense ? "yes" : "—"}</TableCell>
                </TableRow>
              );
            })}
            {board.loans.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">
                No loans on the book yet — complete a disbursement or load the demo portfolio.
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
