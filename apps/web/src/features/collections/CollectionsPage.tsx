import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button,
  Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Snackbar,
} from "@mui/material";
import { worklist, recordAction, createPtp, assignFieldTask, dunningQueue,
         dunningRun, resolveDunning, listWatchlist, addToWatchlist,
         clearWatchlistEntry, listAuctions,
         type WorklistRow, type QueuedDunning,
         type WatchlistEntryView, type AuctionEntryView }
  from "../../api/collections";
import { formatTk } from "../../api/money";
import { indexLiveRecords } from "../../shell/search";
import { PageHeader } from "../../shell/PageHeader";
import { useAuth } from "../../auth/AuthProvider";
import { COLLECTIONS_WRITE } from "../../auth/roles";
import { Kpi, KpiRow } from "../../shell/Kpi";

/** Collections workbench — prototype F2 board: buckets, P1 boost, PTP + actions (03). */
export function CollectionsPage() {
  const authRoles = useAuth().session?.roles ?? [];
  const canWrite = authRoles.some((r) => COLLECTIONS_WRITE.has(r));
  const nav = useNavigate();
  const [rows, setRows] = React.useState<WorklistRow[]>([]);
  const [dunning, setDunning] = React.useState<QueuedDunning[]>([]);
  const [watch, setWatch] = React.useState<WatchlistEntryView[]>([]);
  const [auctions, setAuctions] = React.useState<AuctionEntryView[]>([]);
  const [ptpFor, setPtpFor] = React.useState<WorklistRow | null>(null);
  const [form, setForm] = React.useState({
    amountLakh: "1", promisedOn: "", confidence: "HIGH",
    contactName: "", contactRelation: "Self", contactPhone: "", remark: "",
  });
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    try {
      const list = await worklist();
      setRows(list);
      setDunning(await dunningQueue().catch(() => []));
      setWatch(await listWatchlist("OPEN").catch(() => []));
      setAuctions(await listAuctions().catch(() => []));
      // Q1.6 Tell-ME live indexing: delinquent loans enter the corpus
      indexLiveRecords(list.slice(0, 100).map((r) => ({
        id: r.loanNo, title: "Loan · collections",
        sub: `${r.classification} · DPD ${r.dpd}`, route: `/loans/${r.loanId}`,
      })));
    } catch (e) { setErr(String(e)); }
  }, []);
  React.useEffect(() => {
    void reload();
    setForm((f) => ({ ...f, promisedOn: new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10) }));
  }, [reload]);

  async function onAction(loanId: string, type: string) {
    try {
      await recordAction(loanId, type, "CONTACTED", `${type} logged from workbench`);
      setMsg(`${type} logged`);
      await reload();
    } catch (e) { setErr(String(e)); }
  }

  async function onPtpSave() {
    if (!ptpFor) return;
    setErr(null);
    try {
      await createPtp(ptpFor.loanId, {
        promisedAmountMinor: Math.round(parseFloat(form.amountLakh || "0") * 100000 * 100),
        promisedOn: form.promisedOn,
        confidence: form.confidence,
        contactName: form.contactName || undefined,
        contactRelation: form.contactRelation || undefined,
        contactPhone: form.contactPhone || undefined,
        remark: form.remark || undefined,
      });
      setPtpFor(null); setMsg("PTP recorded");
      await reload();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  async function onFieldTask(loanId: string) {
    try {
      await assignFieldTask(loanId, "user:field-agent",
        new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10));
      setMsg("Field task assigned");
    } catch (e) { setErr(String(e)); }
  }

  async function onDunningRun() {
    try {
      const queued = await dunningRun();
      setMsg(`Dunning pass queued ${queued} step(s)`);
      await reload();
    } catch (e) { setErr(String(e)); }
  }

  async function onResolveDunning(actionId: string) {
    try {
      await resolveDunning(actionId, "CONTACTED", "acted from workbench");
      setMsg("Dunning step resolved");
      await reload();
    } catch (e) { setErr(String(e)); }
  }

  // Q1.4 early-warning watchlist: quick-add from the worklist (officers can
  // refine the reason/note via the API), terminal clear with evidence
  async function onWatch(loanId: string) {
    try {
      await addToWatchlist(loanId, "DPD_RISING", "added from workbench");
      setMsg("Loan watchlisted (7-day review)");
      await reload();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  async function onWatchClear(id: string, loanNo: string) {
    try {
      await clearWatchlistEntry(id, `cleared from workbench — ${loanNo}`);
      setMsg("Watchlist entry cleared");
      await reload();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  const prioColor = (p: string) => p === "P1" ? "error" : p === "P2" ? "warning" : "default";

  const p1 = rows.filter((r) => r.priority === "P1").length;
  const bucket = (min: number, max: number) =>
    rows.filter((r) => r.dpd >= min && r.dpd <= max).length;
  const exposureMinor = rows.reduce((s, r) => s + r.outstandingMinor, 0);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <PageHeader
        crumbs={[{ label: "Monitoring & Collections" }, { label: "Collections Workbench" }]}
        title="Collections Worklist"
        sub="DPD buckets · P1 priority boost · promise-to-pay ladder · field tasks"
        badge={`${rows.length} delinquent`}
        actions={
          <Button size="small" variant="outlined" onClick={onDunningRun}>
            Run dunning pass
          </Button>
        }
      />
      <KpiRow>
        <Kpi tone="err" label="P1 — act today" value={p1} />
        <Kpi tone="warn" label="1–30 DPD" value={bucket(1, 30)} />
        <Kpi tone="warn" label="31–90 DPD (SMA)" value={bucket(31, 90)} />
        <Kpi tone="primary" label="Delinquent exposure"
          value={formatTk(exposureMinor)}
          delta={{ dir: "flat", text: `${rows.filter((r) => r.hasBrokenPtp).length} broken PTP` }} />
      </KpiRow>
      {dunning.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="subtitle2">
            Dunning queue — {dunning.length} timer step(s) due
          </Typography>
          {dunning.slice(0, 6).map((d) => (
            <Box key={d.id} sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
              <Chip size="small" color="warning" label={d.actionType} />
              <Typography variant="caption">
                loan {d.loanId.slice(0, 8)}… · due {d.dueOn ?? "—"}
              </Typography>
              <Button size="small" onClick={() => onResolveDunning(d.id)}>Mark contacted</Button>
            </Box>
          ))}
        </Paper>
      )}
      {watch.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="subtitle2">
            Early-warning watchlist — {watch.length} open (nightly scan auto-adds STD-2)
          </Typography>
          {watch.slice(0, 8).map((w) => (
            <Box key={w.id} sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
              <Chip size="small" color={w.reasonCode === "AUTO_STD2" ? "error" : "warning"}
                label={w.reasonCode} />
              <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{w.loanNo}</Typography>
              <Typography variant="caption">
                review by {w.reviewBy?.slice(0, 10)}{w.note ? ` · ${w.note}` : ""}
              </Typography>
              <Button size="small" disabled={!canWrite} onClick={() => onWatchClear(w.id, w.loanNo)}>
                Clear
              </Button>
            </Box>
          ))}
        </Paper>
      )}
      <Paper variant="outlined">
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Priority</TableCell><TableCell>Loan</TableCell><TableCell>DPD</TableCell>
            <TableCell>Class</TableCell><TableCell>Outstanding</TableCell>
            <TableCell>Broken PTP</TableCell><TableCell>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.loanId} hover>
                <TableCell><Chip size="small" color={prioColor(r.priority) as any} label={r.priority} /></TableCell>
                <TableCell sx={{ fontFamily: "monospace" }}
                  style={{ cursor: "pointer" }} onClick={() => nav(`/loans/${r.loanId}`)}>
                  {r.loanNo}
                </TableCell>
                <TableCell>{r.dpd}</TableCell>
                <TableCell><Chip size="small" label={r.classification}
                  color={r.classification.startsWith("STD") ? "success" : "error"} /></TableCell>
                <TableCell>{formatTk(r.outstandingMinor)}</TableCell>
                <TableCell>{r.hasBrokenPtp ? <Chip size="small" color="error" label="yes" /> : "—"}</TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Button size="small" disabled={!canWrite}
                      title={canWrite ? undefined : "Requires collections or admin role (06 §1)"}
                      onClick={() => onAction(r.loanId, "SMS")}>SMS</Button>
                    <Button size="small" disabled={!canWrite}
                      title={canWrite ? undefined : "Requires collections or admin role (06 §1)"}
                      onClick={() => onAction(r.loanId, "CALL")}>Call</Button>
                    <Button size="small" disabled={!canWrite}
                      title={canWrite ? undefined : "Requires collections or admin role (06 §1)"}
                      onClick={() => onAction(r.loanId, "VISIT")}>Visit</Button>
                    <Button size="small" variant="contained" disabled={!canWrite}
                      title={canWrite ? undefined : "Requires collections or admin role (06 §1)"}
                      onClick={() => setPtpFor(r)}>PTP</Button>
                    <Button size="small" variant="outlined" disabled={!canWrite}
                      title={canWrite ? undefined : "Requires collections or admin role (06 §1)"}
                      onClick={() => onFieldTask(r.loanId)}>Field</Button>
                    <Button size="small" disabled={!canWrite}
                      title={canWrite ? "Early-warning watchlist (Q1.4)" : undefined}
                      onClick={() => onWatch(r.loanId)}>Watch</Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">
                No delinquent loans — all DPD buckets clear.
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={!!ptpFor} onClose={() => setPtpFor(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Promise to Pay — {ptpFor?.loanNo}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1 }}>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
            <TextField size="small" type="number" label="Promised amount (৳ Lakh)"
              value={form.amountLakh} onChange={(e) => setForm({ ...form, amountLakh: e.target.value })} />
            <TextField size="small" type="date" label="Promise date" value={form.promisedOn}
              InputLabelProps={{ shrink: true }}
              onChange={(e) => setForm({ ...form, promisedOn: e.target.value })} />
            <TextField select size="small" label="Confidence" value={form.confidence}
              onChange={(e) => setForm({ ...form, confidence: e.target.value })}>
              {["HIGH", "MEDIUM", "LOW"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Contact relation" value={form.contactRelation}
              onChange={(e) => setForm({ ...form, contactRelation: e.target.value })}>
              {["Self", "Spouse", "Parent", "Sibling", "Guarantor", "Business partner"].map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
            <TextField size="small" label="Contact name" value={form.contactName}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
            <TextField size="small" label="Contact phone" value={form.contactPhone}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          </Box>
          <TextField size="small" label="Remark / context" fullWidth multiline minRows={2}
            value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} />
          <Alert severity="info">
            Snapshot at promise: DPD {ptpFor?.dpd}, class {ptpFor?.classification} — kept/broken
            derives from payments at the promise date.
          </Alert>
          {err && <Alert severity="error">{err}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPtpFor(null)}>Cancel</Button>
          <Button variant="contained" onClick={onPtpSave}
            disabled={!form.promisedOn || !(parseFloat(form.amountLakh) > 0)}>
            Record promise
          </Button>
        </DialogActions>
      </Dialog>

      {auctions.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Typography variant="subtitle2">
            Collateral auction ledger — {auctions.length} entry (proceeds post as recovery, 5% incentive)
          </Typography>
          {auctions.slice(0, 8).map((a) => (
            <Box key={a.id} sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.5 }}>
              <Chip size="small"
                color={a.status === "SOLD" ? "success" : a.status === "CANCELLED" ? "default" : "info"}
                label={a.status} />
              <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{a.loanNo}</Typography>
              <Typography variant="caption">
                {a.venue} · {a.scheduledFor?.slice(0, 10)}
                {a.proceedsMinor != null ? ` · sold ${formatTk(a.proceedsMinor)}` : ` · reserve ${formatTk(a.reserveMinor)}`}
              </Typography>
            </Box>
          ))}
        </Paper>
      )}

      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg(null)}>
        <Alert severity="success" onClose={() => setMsg(null)}>{msg}</Alert>
      </Snackbar>
      <Snackbar open={!!err && !ptpFor} autoHideDuration={6000} onClose={() => setErr(null)}>
        <Alert severity="error" onClose={() => setErr(null)}>{err}</Alert>
      </Snackbar>
    </Box>
  );
}
