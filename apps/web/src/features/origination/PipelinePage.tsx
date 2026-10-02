import * as React from "react";
import {
  Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button,
  Box, Chip, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { listApplications, currentTask, actOnTask, getLadder, cpvApplication,
         type ApplicationView, type ApprovalTask, type LadderRung } from "../../api/applications";
import { listCustomers, type CustomerView } from "../../api/customers";
import { formatTk } from "../../api/money";
import { DocumentPanel } from "./DocumentPanel";
import { AssessmentPanel } from "./AssessmentPanel";
import { DisbursementPanel, PrepareDisbursementButton } from "./DisbursementPanel";
import { PageHeader } from "../../shell/PageHeader";
import { Kpi, KpiRow } from "../../shell/Kpi";

/** Pipeline + approval drawer — prototype contract: stage chips, ladder, act with remark. */
export function PipelinePage() {
  const [apps, setApps] = React.useState<ApplicationView[]>([]);
  const [customers, setCustomers] = React.useState<CustomerView[]>([]);
  const [ladder, setLadder] = React.useState<LadderRung[]>([]);
  const [selected, setSelected] = React.useState<ApplicationView | null>(null);
  const [task, setTask] = React.useState<ApprovalTask | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const [a, l, c] = await Promise.all([listApplications(), getLadder(), listCustomers()]);
      setApps(a); setLadder(l); setCustomers(c.data);
    } catch (e) { setErr(String(e instanceof Error ? e.message : e)); }
  }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);

  async function openDetail(app: ApplicationView) {
    setSelected(app);
    setTask(await currentTask(app.id).catch(() => null));
  }

  async function act(action: "APPROVE" | "REJECT" | "RETURN") {
    if (!task) return;
    try {
      const out = await actOnTask(task.taskId, action, "user:approver");
      setMsg(`${action} done — ${out.event}`);
      await closeAndRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function cpv(passed: boolean) {
    if (!selected) return;
    try {
      const after = await cpvApplication(selected.id, passed, passed ? "verified" : "failed visit");
      setMsg(passed ? `CPV passed — ladder started (${after.stage})` : "CPV failed — back to screening");
      await closeAndRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function closeAndRefresh() {
    setSelected(null); setTask(null);
    await refresh();
  }

  const stageColor = (s: string) =>
    s === "DISBURSED" ? "success" : s === "SANCTION" || s === "DISBURSEMENT" ? "info" :
    s === "APPROVAL" || s === "CPV" ? "warning" :
    s === "SCREENING" ? "error" : "default";

  const cifOf = (customerId: string) =>
    customers.find((c) => c.id === customerId)?.cifNo;

  const inFlight = apps.filter((a) => !["DISBURSED", "REJECTED"].includes(a.stage));
  const booked = apps.filter((a) => a.stage === "DISBURSED");
  const bookedTk = booked.reduce((sum, a) => sum + a.amountMinor, 0);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <PageHeader
        crumbs={[{ label: "Loan Origination (LOS)" }, { label: "Application Pipeline" }]}
        title="Application Pipeline"
        sub="Originations TAT · DBR guardrail 50% · two-officer maker-checker"
        badge={`${inFlight.length} in flight`}
      />
      <KpiRow>
        <Kpi tone="primary" label="Applications in flight" value={inFlight.length} />
        <Kpi tone="ok" label="Disbursed (book)" value={booked.length}
          delta={{ dir: "flat", text: `${formatTk(bookedTk)} sanctioned value` }} />
        <Kpi tone="warn" label="At approval / CPV" value={apps.filter((a) => ["APPROVAL", "CPV"].includes(a.stage)).length} />
        <Kpi tone="err" label="Screening holds" value={apps.filter((a) => a.stage === "SCREENING").length} />
      </KpiRow>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>App</TableCell><TableCell>Stage</TableCell><TableCell>Amount</TableCell>
              <TableCell>Tenor</TableCell><TableCell>DBR</TableCell><TableCell>Branch</TableCell><TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apps.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell sx={{ fontFamily: "monospace" }}>{a.appNo}</TableCell>
                <TableCell><Chip size="small" color={stageColor(a.stage) as any} label={a.stage} /></TableCell>
                <TableCell>{formatTk(a.amountMinor)}</TableCell>
                <TableCell>{a.tenorMonths}m</TableCell>
                <TableCell>{a.dbrPercent != null ? `${a.dbrPercent}%` : "—"}</TableCell>
                <TableCell>{a.branchCode}</TableCell>
                <TableCell><Button size="small" onClick={() => openDetail(a)}>Open</Button></TableCell>
              </TableRow>
            ))}
            {apps.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">No applications — submit one via Apply.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selected?.appNo} — {selected?.stage}
          {task && <> · {task.node} ({task.role})</>}
          {task?.phase === "CHECK" && <Chip size="small" color="warning" label="maker-checker check" sx={{ ml: 1 }} />}
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1.5 }}>
          <Typography variant="body2">
            Amount {selected && formatTk(selected.amountMinor)} · DBR{" "}
            {selected?.dbrPercent != null ? `${selected.dbrPercent}%` : "—"} · bureau obligation{" "}
            {selected?.cibObligationMinor != null ? formatTk(selected.cibObligationMinor) : "—"}
          </Typography>

          {selected && <AssessmentPanel appId={selected.id} cif={cifOf(selected.customerId)} />}

          {selected?.stage === "CPV" && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button size="small" variant="contained" color="success" onClick={() => cpv(true)}>
                CPV pass — start ladder
              </Button>
              <Button size="small" color="error" onClick={() => cpv(false)}>CPV fail</Button>
            </Box>
          )}

          {selected && selected.stage !== "CPV" && (
            <>
              <Typography variant="subtitle2">Documents</Typography>
              <DocumentPanel appId={selected.id} />
            </>
          )}

          {task && (
            <>
              <Typography variant="subtitle2">Approval ladder</Typography>
              {ladder.map((r) => (
                <Box key={r.level} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip size="small" variant={task.node === `L${r.level}` ? "filled" : "outlined"}
                    color={task.node === `L${r.level}` ? "primary" : "default"} label={`L${r.level}`} />
                  <Typography variant="caption">{r.roleNameEn}</Typography>
                </Box>
              ))}
            </>
          )}

          {selected?.stage === "SANCTION" && (
            <PrepareDisbursementButton appId={selected.id} onPrepared={refresh} />
          )}
          {(selected?.stage === "DISBURSEMENT" || selected?.stage === "DISBURSED") && selected && (
            <DisbursementPanel appId={selected.id} onReleased={refresh} />
          )}
        </DialogContent>
        <DialogActions>
          {task && <>
            <Button color="error" onClick={() => act("REJECT")}>Reject</Button>
            <Button onClick={() => act("RETURN")}>Return</Button>
            <Button variant="contained" onClick={() => act("APPROVE")}>Approve</Button>
          </>}
          {!task && <Button onClick={() => setSelected(null)}>Close</Button>}
        </DialogActions>
      </Dialog>

      <Snackbar open={!!msg} autoHideDuration={5000} onClose={() => setMsg(null)}>
        <Alert severity="success" onClose={() => setMsg(null)}>{msg}</Alert>
      </Snackbar>
      <Snackbar open={!!err} autoHideDuration={6000} onClose={() => setErr(null)}>
        <Alert severity="error" onClose={() => setErr(null)}>{err}</Alert>
      </Snackbar>
    </Box>
  );
}
