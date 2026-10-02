import * as React from "react";
import {
  Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button,
  Box, Chip, Alert, CircularProgress, MenuItem, TextField, Tabs, Tab,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import {
  generateReturn, downloadReturnFile, getPortfolio, getEcl,
  listDefinitions, saveDefinition, runDefinition,
  type ReturnEntry, type PortfolioReadModel, type EclBoard,
  type ReportDefinitionView,
} from "../../api/regcon";
import { getReturnsBoard } from "../../api/regcon";
import { useLang, t } from "../../i18n/bilingual";
import { formatTk } from "../../api/money";
import { PageHeader } from "../../shell/PageHeader";
import { Kpi, KpiRow } from "../../shell/Kpi";

/**
 * Report Center (P4 / 07 §5 + prototype pgReports): statutory shelf with the
 * parameter shelf (period) on each report, export via the API file call, the
 * IFRS-9 ECL statement view, and the portfolio read model (MV_LOAN_PORTFOLIO
 * shape) grouped by classification / stage / branch. Money formatting happens
 * in the API for exports; the viewer renders minor units via the shared fn.
 */
const STATUTORY = ["CL-1", "CL-2", "CL-3", "CL-4", "CL-5", "CIB-S", "CIB-C", "CAR", "EDW", "ECL", "LLF"];

export function ReportViewerPage() {
  useLang();   // re-render the chrome on language toggle
  const [tab, setTab] = React.useState(0);
  const [board, setBoard] = React.useState<ReturnEntry[] | null>(null);
  const [portfolio, setPortfolio] = React.useState<PortfolioReadModel | null>(null);
  const [ecl, setEcl] = React.useState<EclBoard | null>(null);
  const [groupby, setGroupby] = React.useState("classification");
  const [period, setPeriod] = React.useState(defaultPeriod());
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [defs, setDefs] = React.useState<ReportDefinitionView[] | null>(null);
  const [defResult, setDefResult] = React.useState<(PortfolioReadModel & { definition: { name: string } }) | null>(null);
  const [newName, setNewName] = React.useState("");
  const [newGroup, setNewGroup] = React.useState("classification");

  const refreshBoard = React.useCallback(async () => {
    try { setBoard((await getReturnsBoard()).entries); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, []);
  React.useEffect(() => { void refreshBoard(); }, [refreshBoard]);

  const refreshPortfolio = React.useCallback(async (by: string) => {
    try { setPortfolio(await getPortfolio(by)); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, []);
  React.useEffect(() => { if (tab === 1) void refreshPortfolio(groupby); }, [tab, groupby, refreshPortfolio]);

  const refreshEcl = React.useCallback(async () => {
    try { setEcl(await getEcl()); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, []);
  React.useEffect(() => { if (tab === 2) void refreshEcl(); }, [tab, refreshEcl]);

  const refreshDefs = React.useCallback(async () => {
    try { setDefs(await listDefinitions()); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  }, []);
  React.useEffect(() => { if (tab === 3) void refreshDefs(); }, [tab, refreshDefs]);

  async function onSaveDefinition() {
    setBusy("def"); setError(null); setNotice(null);
    try {
      const d = await saveDefinition(newName.trim(), newGroup);
      setNotice(`Report "${d.name}" saved — grouped by ${d.groupBy}, schedule ${d.schedule}.`);
      setNewName("");
      await refreshDefs();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  async function onRunDefinition(id: string) {
    setBusy(id); setError(null);
    try { setDefResult(await runDefinition(id)); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  async function onGenerate(code: string) {
    setBusy(code); setError(null); setNotice(null);
    try {
      const r = await generateReturn(code, period);
      setNotice(`${code} for ${r.period} staged — ${r.rowCount} rows · ${r.fileFormat} · sha256 ${r.fileSha256.slice(0, 12)}…`);
      await refreshBoard();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  async function onDownload(code: string) {
    const entry = board?.find((e) => e.code === code);
    if (!entry?.returnId) { setError(`${code} has no generated pack for any period yet — generate first.`); return; }
    setBusy(code); setError(null);
    try { await downloadReturnFile(entry); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(null); }
  }

  // Loading state renders the error surface too — an expired session shows a
  // retryable message, never an infinite spinner (parity audit 2026-09-30).
  if (!board) {
    return (
      <Box sx={{ display: "grid", gap: 2 }}>
        <PageHeader
          crumbs={[{ label: "Insight & Compliance" }, { label: t("nav.compliance.reports") }]}
          title={t("compliance.reports.title")}
        />
        {error
          ? <Alert severity="error">Returns board failed: {error} — check the session and reload.</Alert>
          : <CircularProgress />}
      </Box>
    );
  }

  const filedCount = board.filter((e) => e.status === "Filed").length;

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <PageHeader
        crumbs={[{ label: "Insight & Compliance" }, { label: t("nav.compliance.reports") }]}
        title={t("compliance.reports.title")}
        sub="Bilingual output · PDF / Excel · p95 export < 10s · WORM-staged packs"
        badge={`${STATUTORY.length} statutory + portfolio read model`}
        actions={
          <TextField select size="small" label="Period" value={period}
            onChange={(e) => setPeriod(e.target.value)} sx={{ minWidth: 130 }}>
            {nextPeriods().map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
        }
      />
      <KpiRow>
        <Kpi tone="primary" label="Statutory returns" value={STATUTORY.length} />
        <Kpi tone="ok" label="Filed" value={filedCount}
          delta={{ dir: "flat", text: `${board.length - filedCount} outstanding` }} />
        <Kpi tone="warn" label="Not started" value={board.filter((e) => e.status === "Not started").length} />
        <Kpi tone="info" label="Board group" value={board.length} />
      </KpiRow>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="info">{notice}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Statutory returns" />
        <Tab label="Portfolio read model" />
        <Tab label="IFRS-9 ECL statement" />
        <Tab label="My reports (writer)" />
      </Tabs>

      {tab === 0 && (
        <Paper>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Report</TableCell><TableCell>Latest period</TableCell><TableCell>Rows</TableCell>
              <TableCell>Status</TableCell><TableCell>Checksum (sha256)</TableCell><TableCell align="right" />
            </TableRow></TableHead>
            <TableBody>
              {board.filter((e) => STATUTORY.includes(e.code)).map((e) => (
                <TableRow key={e.code}>
                  <TableCell><b>{e.code}</b> — {e.description}</TableCell>
                  <TableCell>{e.latestPeriod ?? "—"}</TableCell>
                  <TableCell>{e.returnId ? e.rowCount : "—"}</TableCell>
                  <TableCell><Chip size="small"
                    color={(e.status === "Filed" ? "success" : e.status === "Not started" ? "default" : "warning") as any}
                    label={e.status} /></TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>
                    {e.fileSha256 ? `${e.fileSha256.slice(0, 16)}…` : "—"}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" disabled={busy !== null} onClick={() => onGenerate(e.code)}>
                      {busy === e.code ? <CircularProgress size={14} /> : "Generate"}
                    </Button>{" "}
                    <Button size="small" startIcon={<DownloadIcon />} disabled={busy !== null}
                      onClick={() => onDownload(e.code)}>Export</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {tab === 1 && (
        <Paper>
          <Box sx={{ p: 2, display: "flex", gap: 2, alignItems: "center" }}>
            <TextField select size="small" label="Group by" value={groupby}
              onChange={(e) => setGroupby(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="classification">Classification (BRPD)</MenuItem>
              <MenuItem value="stage">Loan stage</MenuItem>
              <MenuItem value="branch">Branch</MenuItem>
            </TextField>
            {portfolio && (
              <Typography variant="caption">
                {portfolio.activeLoans} active loans · outstanding {formatTk(portfolio.totalOutstandingMinor, { full: true })} · provision {formatTk(portfolio.totalProvisionMinor, { full: true })}
              </Typography>
            )}
          </Box>
          {portfolio && (
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>{portfolio.groupBy}</TableCell><TableCell>Loans</TableCell>
                <TableCell>Principal</TableCell><TableCell>Outstanding</TableCell>
                <TableCell>Provision</TableCell><TableCell>Coverage</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {portfolio.rows.map((r) => (
                  <TableRow key={String(r[portfolio.groupBy])}>
                    <TableCell><b>{String(r[portfolio.groupBy])}</b></TableCell>
                    <TableCell>{r.loans}</TableCell>
                    <TableCell>{formatTk(r.principalMinor, { full: true })}</TableCell>
                    <TableCell>{formatTk(r.outstandingMinor, { full: true })}</TableCell>
                    <TableCell>{formatTk(r.provisionMinor, { full: true })}</TableCell>
                    <TableCell>{r.coveragePercent}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {tab === 2 && (
        !ecl ? <CircularProgress /> : (
          <Paper sx={{ p: 2, display: "grid", gap: 2 }}>
            <Alert severity={ecl.runwayMonths <= 6 ? "error" : "warning"}>
              IFRS-9 becomes mandatory {ecl.mandatoryFrom} — runway {ecl.runwayMonths} months.
              ECL {formatTk(ecl.eclMinor, { full: true })} vs BRPD provision {formatTk(ecl.brpdProvisionMinor, { full: true })} ·
              delta {formatTk(ecl.deltaMinor, { full: true })} (as of {ecl.asOf}).
            </Alert>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>BRPD stage</TableCell><TableCell>IFRS stage</TableCell><TableCell>Loans</TableCell>
                <TableCell>EAD</TableCell><TableCell>PD</TableCell><TableCell>LGD</TableCell>
                <TableCell>ECL</TableCell><TableCell>BRPD provision</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {ecl.rows.map((r) => (
                  <TableRow key={r.stage}>
                    <TableCell><b>{r.stage}</b></TableCell>
                    <TableCell>{r.ifrsStage}</TableCell>
                    <TableCell>{r.loans}</TableCell>
                    <TableCell>{formatTk(r.eadMinor, { full: true })}</TableCell>
                    <TableCell>{r.pdBp / 100}%</TableCell>
                    <TableCell>{r.lgdBp / 100}%</TableCell>
                    <TableCell>{formatTk(r.eclMinor, { full: true })}</TableCell>
                    <TableCell>{formatTk(r.brpdProvisionMinor, { full: true })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )
      )}
      {tab === 3 && (
        <Paper sx={{ p: 2, display: "grid", gap: 2 }}>
          <Typography variant="subtitle2">
            Report Writer — save a governed report over the portfolio read model (no free-form SQL)
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField size="small" label="Report name" value={newName}
              onChange={(e) => setNewName(e.target.value)} sx={{ minWidth: 240 }}
              placeholder="e.g. My branch risk pack" />
            <TextField select size="small" label="Group by" value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)} sx={{ minWidth: 180 }}>
              <MenuItem value="classification">Classification (BRPD)</MenuItem>
              <MenuItem value="stage">Loan stage</MenuItem>
              <MenuItem value="branch">Branch</MenuItem>
            </TextField>
            <Button variant="contained" size="small" disabled={busy !== null || newName.trim().length < 3}
              onClick={onSaveDefinition}>
              {busy === "def" ? <CircularProgress size={14} /> : "Save report"}
            </Button>
          </Box>
          {!defs ? <CircularProgress size={20} /> : defs.length === 0 ? (
            <Typography variant="caption">No saved reports yet.</Typography>
          ) : (
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Name</TableCell><TableCell>Group by</TableCell><TableCell>Schedule</TableCell>
                <TableCell>Created by</TableCell><TableCell />
              </TableRow></TableHead>
              <TableBody>
                {defs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell><b>{d.name}</b></TableCell>
                    <TableCell>{d.groupBy}</TableCell>
                    <TableCell>{d.schedule}</TableCell>
                    <TableCell>{d.createdBy}</TableCell>
                    <TableCell align="right">
                      <Button size="small" disabled={busy !== null}
                        onClick={() => onRunDefinition(d.id)}>
                        {busy === d.id ? <CircularProgress size={14} /> : "Run"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {defResult && (
            <Alert severity="info">
              {defResult.definition.name}: {defResult.rows.length} groups · outstanding{" "}
              {formatTk(defResult.totalOutstandingMinor, { full: true })} · provision{" "}
              {formatTk(defResult.totalProvisionMinor, { full: true })}
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
}

function defaultPeriod(): string {
  const now = new Date();
  const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prior.getFullYear()}-${String(prior.getMonth() + 1).padStart(2, "0")}`;
}

function nextPeriods(): string[] {
  const out: string[] = [];
  const d = new Date(); d.setDate(1);
  for (let i = 0; i < 6; i++) {
    const p = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}
