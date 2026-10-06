import * as React from "react";
import {
  Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button,
  Box, Chip, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, LinearProgress,
} from "@mui/material";
import EventNoteIcon from "@mui/icons-material/EventNote";
import {
  getReturnsBoard, generateReturn, signoffCheck, signoffFile, downloadReturnFile,
  getRegconCalendar, getCar, type RegconBoard, type CalendarDue, type CarInputs,
} from "../../api/regcon";
import { useLang, t } from "../../i18n/bilingual";
import { useAuth } from "../../auth/AuthProvider";
import { REGCON_SIGNOFF } from "../../auth/roles";
import { PageHeader } from "../../shell/PageHeader";
import { Kpi, KpiRow } from "../../shell/Kpi";

/**
 * Regulatory Console (P4 / G4, prototype pgRegcon + G3-s2): the 12-row BB
 * returns board with statuses and the sign-off chain, KPI row, Basel CAR
 * gauge card, and the submission calendar dialog. Generation goes through the
 * API (money is never formatted client-side — 07 §5).
 */
export function RegconPage() {
  useLang();
  // R2: sign-off chain is compliance/admin (06 §1); preparer=system generates
  const authRoles = useAuth().session?.roles ?? [];
  const canSignoff = authRoles.some((r) => REGCON_SIGNOFF.has(r));   // re-render the chrome on language toggle (07 §6: one language per element)
  const [board, setBoard] = React.useState<RegconBoard | null>(null);
  const [car, setCar] = React.useState<CarInputs | null>(null);
  const [calendar, setCalendar] = React.useState<CalendarDue[] | null>(null);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busyCode, setBusyCode] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const [b, c] = await Promise.all([getReturnsBoard(), getCar()]);
      setBoard(b); setCar(c); setError(null);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);

  const periodForGenerate = () => {
    const now = new Date();
    // returns report on the prior month's data (10 Oct reports September)
    const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${prior.getFullYear()}-${String(prior.getMonth() + 1).padStart(2, "0")}`;
  };

  async function onGenerate(code: string) {
    setBusyCode(code); setError(null); setNotice(null);
    try {
      const r = await generateReturn(code, periodForGenerate());
      setNotice(`${code} generated for ${r.period} — ${r.rowCount} rows, staged with preparer=system (sha256 ${r.fileSha256.slice(0, 12)}…)`);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusyCode(null); }
  }

  /** A pack FILED for its due period is done — regenerating would un-file it. */
  const filedForDuePeriod = (e: { status: string; nextDue: string | null; latestPeriod: string | null }) => {
    if (e.status !== "Filed" || !e.nextDue || !e.latestPeriod) return false;
    const due = new Date(e.nextDue);
    const prior = new Date(due.getFullYear(), due.getMonth() - 1, 1);   // periodOf(due) = prior month
    return e.latestPeriod === `${prior.getFullYear()}-${String(prior.getMonth() + 1).padStart(2, "0")}`;
  };

  async function onGenerateAllDue() {
    if (!board) return;
    const due = board.entries.filter((e) => e.frequency !== "CONTINUOUS"
      && e.nextDue && new Date(e.nextDue) <= new Date(new Date().getTime() + 30 * 86400_000)
      && !filedForDuePeriod(e));
    setBusyCode("*ALL*"); setError(null); setNotice(null);
    try {
      for (const e of due) await generateReturn(e.code, periodForGenerate());
      setNotice(`${due.length} due returns generated and staged for the sign-off chain.`);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusyCode(null); }
  }

  async function onSignoff(entryCode: string, id: string, stage: "check" | "file") {
    setBusyCode(entryCode); setError(null); setNotice(null);
    try {
      if (stage === "check") {
        const r = await signoffCheck(id);
        setNotice(`${entryCode}: checker sign-off recorded (${r.checker}) — status ${r.status}.`);
      } else {
        const r = await signoffFile(id);
        setNotice(`${entryCode}: compliance approved and submitted to Bangladesh Bank at ${r.submittedAt}.`);
      }
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusyCode(null); }
  }

  async function onDownload(code: string, id: string | null) {
    if (!id) return;
    const entry = board?.entries.find((e) => e.code === code);
    if (!entry) return;
    setBusyCode(code); setError(null);
    try { await downloadReturnFile(entry); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusyCode(null); }
  }

  async function openCalendar() {
    setCalendarOpen(true);
    try { setCalendar(await getRegconCalendar(6)); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }

  if (!board) return <CircularProgress />;

  const statusChip = (s: string) =>
    s === "Filed" || s === "Live" ? "success"
      : s === "Not started" ? "default"
      : "warning";

  const carPercent = car?.car_percent ?? board.kpis.carPercent;
  const carDisplay = carPercent == null ? "—" : carPercent > 20 ? ">20" : carPercent.toFixed(1);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <PageHeader
        crumbs={[{ label: "Insight & Compliance" }, { label: t("nav.compliance.regcon") }]}
        title={t("compliance.regcon.title")}
        sub="CL series · CIB files · Basel III · EDW · IFRS-9 — with compliance sign-off chain"
        badge={`${board.kpis.onTimeStreak}/${board.kpis.filedTotal} on-time`}
        actions={
          <>
            <Button variant="contained" size="small" disabled={busyCode !== null} onClick={onGenerateAllDue}>
              {busyCode === "*ALL*" ? <CircularProgress size={16} /> : "Generate all due"}
            </Button>
            <Button variant="outlined" size="small" startIcon={<EventNoteIcon />} onClick={openCalendar}>
              Submission calendar
            </Button>
          </>
        }
      />
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="info">{notice}</Alert>}

      <KpiRow>
        <Kpi tone="primary" label="Returns due 30d" value={board.kpis.dueIn30Days} />
        <Kpi tone="ok" label="On-time streak" value={`${board.kpis.onTimeStreak} / ${board.kpis.filedTotal}`}
          delta={{ dir: "up", text: "filed on time" }} />
        <Kpi tone={carPercent != null && carPercent < board.kpis.carFloorPercent ? "err" : "ok"}
          label={`CAR vs ${board.kpis.carFloorPercent}% floor`} value={`${carDisplay}%`}
          delta={car ? { dir: "flat", text: `RWA ৳${Number(car.rwa_taka).toLocaleString()} · buffer ${car.buffer_pp == null ? "—" : `${car.buffer_pp.toFixed(1)}pp`}` } : undefined} />
        <Kpi tone="warn" label="IFRS-9 runway" value={`${board.kpis.eclRunwayMonths} mo`}
          delta={{ dir: "flat", text: `mandatory ${board.kpis.eclMandatoryFrom}` }} />
      </KpiRow>

      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Return</TableCell><TableCell>Description</TableCell><TableCell>Frequency</TableCell>
            <TableCell>Next due</TableCell><TableCell>Status</TableCell>
            <TableCell>Sign-off (preparer → checker → compliance)</TableCell><TableCell />
          </TableRow></TableHead>
          <TableBody>
            {board.entries.map((e) => (
              <TableRow key={e.code}>
                <TableCell><b>{e.code}</b></TableCell>
                <TableCell>{e.description}</TableCell>
                <TableCell>{e.frequency}</TableCell>
                <TableCell>{e.nextDue ?? "—"}</TableCell>
                <TableCell><Chip size="small" color={statusChip(e.status) as any} label={e.status} /></TableCell>
                <TableCell>
                  {e.returnId ? (
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      <Chip size="small" color="success" variant="outlined" label={`✓ ${e.preparer ?? "system"}`} />
                      <Chip size="small" variant="outlined"
                        color={e.checker ? "success" : "default"}
                        label={e.checker ? `✓ ${e.checker}` : "checker pending"} />
                      <Chip size="small" variant="outlined"
                        color={e.complianceOfficer ? "success" : "default"}
                        label={e.complianceOfficer ? `✓ ${e.complianceOfficer}` : "compliance pending"} />
                    </Box>
                  ) : e.frequency === "CONTINUOUS" ? <Typography variant="caption">live channel</Typography> : <Typography variant="caption">not generated</Typography>}
                </TableCell>
                <TableCell align="right">
                  {e.frequency !== "CONTINUOUS" && (
                    <>
                      <Button size="small" disabled={busyCode !== null} onClick={() => onGenerate(e.code)}>
                        {busyCode === e.code ? <CircularProgress size={14} /> : e.returnId ? "Regenerate" : "Prepare"}
                      </Button>{" "}
                      {e.returnId && !e.checker && (
                        <Button size="small" variant="outlined"
                          disabled={!canSignoff || busyCode !== null}
                          title={canSignoff ? undefined : "Requires compliance or admin role (06 §1)"}
                          onClick={() => onSignoff(e.code, e.returnId!, "check")}>Check</Button>
                      )}{" "}
                      {e.returnId && e.checker && !e.complianceOfficer && (
                        <Button size="small" variant="contained"
                          disabled={!canSignoff || busyCode !== null}
                          title={canSignoff ? undefined : "Requires compliance or admin role (06 §1)"}
                          onClick={() => onSignoff(e.code, e.returnId!, "file")}>Sign off &amp; file</Button>
                      )}{" "}
                      {e.returnId && (
                        <Button size="small" disabled={busyCode !== null}
                          onClick={() => onDownload(e.code, e.returnId)}>File</Button>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {car && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2">Capital adequacy — Basel III (standardized risk weights by BRPD class)</Typography>
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, ((carPercent ?? 0) / 20) * 100)}
              color={carPercent != null && carPercent < car.floor_percent ? "error" : "success"}
              sx={{ height: 12, borderRadius: 6 }}
            />
            <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
              CAR {carDisplay}% vs floor {car.floor_percent}% · eligible capital ৳{Number(car.eligible_capital_taka).toLocaleString()} · RWA ৳{Number(car.rwa_taka).toLocaleString()}
            </Typography>
          </Box>
        </Paper>
      )}

      <Dialog open={calendarOpen} onClose={() => setCalendarOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submission calendar — next 6 months</DialogTitle>
        <DialogContent>
          {!calendar ? <CircularProgress size={20} /> : (
            <Table size="small">
              <TableHead><TableRow><TableCell>Due date</TableCell><TableCell>Return</TableCell><TableCell>Reports period</TableCell></TableRow></TableHead>
              <TableBody>
                {calendar.map((d) => (
                  <TableRow key={`${d.code}-${d.dueDate}`}>
                    <TableCell>{d.dueDate}</TableCell>
                    <TableCell><b>{d.code}</b></TableCell>
                    <TableCell>{d.period}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
