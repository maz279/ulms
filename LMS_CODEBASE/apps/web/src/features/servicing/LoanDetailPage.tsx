import * as React from "react";
import { useParams } from "react-router-dom";
import {
  Typography, Paper, Tabs, Tab, Box, Button, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, Alert, Snackbar, TextField, MenuItem,
} from "@mui/material";
import {
  getLoan, getSchedule, getStatement, listPayments, postCounterPayment,
  settleQuote, requestReschedule, initiatePayment, type LoanView, type ScheduleLine,
  type StatementRow, type PaymentView, type QuoteView,
} from "../../api/servicing";
import { formatTk } from "../../api/money";
import { PageHeader } from "../../shell/PageHeader";

/** Loan servicing detail — schedule / statement / payments / quote (03 mod-servicing). */
export function LoanDetailPage() {
  const { id } = useParams();
  const [loan, setLoan] = React.useState<LoanView | null>(null);
  const [tab, setTab] = React.useState(0);
  const [schedule, setSchedule] = React.useState<ScheduleLine[]>([]);
  const [stmt, setStmt] = React.useState<{ rows: StatementRow[]; total: number } | null>(null);
  const [payments, setPayments] = React.useState<PaymentView[]>([]);
  const [quote, setQuote] = React.useState<QuoteView | null>(null);
  const [intentUrl, setIntentUrl] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState("");
  const [rail, setRail] = React.useState("BKASH");
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoan(await getLoan(id));
      setSchedule(await getSchedule(id));
      setStmt(await getStatement(id));
      setPayments(await listPayments(id));
    } catch (e) { setErr(String(e instanceof Error ? e.message : e)); }
  }, [id]);
  React.useEffect(() => { void reload(); }, [reload]);

  async function onPay() {
    if (!id || !amount) return;
    setErr(null);
    try {
      await postCounterPayment(id, Math.round(parseFloat(amount) * 100),
        "COUNTER:" + Date.now());
      setAmount(""); setMsg("Payment posted");
      await reload();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  async function onIntent() {
    if (!id || !amount) return;
    setErr(null);
    try {
      const intent = await initiatePayment(id, Math.round(parseFloat(amount) * 100), rail);
      setIntentUrl(intent.railUrl);
      setMsg(`Rail checkout created (${intent.rail}) — borrower redirects out; no card data here`);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  async function onQuote() {
    if (!id) return;
    try { setQuote(await settleQuote(id)); } catch (e) { setErr(String(e)); }
  }

  async function onReschedule() {
    if (!id) return;
    try {
      await requestReschedule(id, loan!.tenorMonths + 12, "hardship restructure");
      setMsg("Reschedule requested — awaiting officer decision");
    } catch (e) { setErr(String(e)); }
  }

  if (!loan) return <Typography>Loading loan…</Typography>;

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <PageHeader
        crumbs={[{ label: "Servicing & Payments", to: "/loans" }, { label: "Loan 360°" }]}
        title={`Loan ${loan.loanNo}`}
        sub={`Outstanding ${formatTk(loan.outstandingMinor, { full: true })} · ${loan.tenorMonths}m @ ${(loan.interestRateBp / 100).toFixed(2)}%`}
        badge={loan.classification}
        actions={<Chip label={`DPD ${loan.dpd}`} size="small" variant="outlined" />}
      />

      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
        <TextField size="small" type="number" label="Amount (৳)" value={amount}
          sx={{ width: 140 }} onChange={(e) => setAmount(e.target.value)} />
        <Button variant="contained" onClick={onPay}>Post counter payment</Button>
        <TextField select size="small" value={rail} sx={{ width: 110 }}
          onChange={(e) => setRail(e.target.value)}>
          {["BKASH", "NAGAD", "BEFTN"].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
        </TextField>
        <Button variant="outlined" onClick={onIntent}>Create rail checkout</Button>
        <Button variant="outlined" onClick={onQuote}>Settle quote</Button>
        <Button variant="outlined" onClick={onReschedule}>Reschedule +12m</Button>
      </Box>
      {intentUrl && <Alert severity="info" onClose={() => setIntentUrl(null)}>Redirect: {intentUrl}</Alert>}
      {quote && (
        <Alert severity="info" onClose={() => setQuote(null)}>
          Early settlement: outstanding {formatTk(quote.outstandingMinor, { full: true })} +
          penalty {formatTk(quote.penaltyMinor)} − rebate {formatTk(quote.rebateMinor)} =
          <b> {formatTk(quote.totalMinor, { full: true })}</b> (valid until{" "}
          {new Date(quote.validUntil).toLocaleDateString()})
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label={`Schedule (${schedule.length})`} />
        <Tab label={`Statement (${stmt?.rows.length ?? 0})`} />
        <Tab label={`Payments (${payments.length})`} />
      </Tabs>

      {tab === 0 && (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>#</TableCell><TableCell>Due</TableCell><TableCell>EMI</TableCell>
              <TableCell>Principal</TableCell><TableCell>Interest</TableCell><TableCell>Balance</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {schedule.map((s) => (
                <TableRow key={s.no} hover>
                  <TableCell>{s.no}</TableCell>
                  <TableCell>{s.dueDate}</TableCell>
                  <TableCell>{formatTk(s.emiMinor)}</TableCell>
                  <TableCell>{formatTk(s.principalMinor)}</TableCell>
                  <TableCell>{formatTk(s.interestMinor)}</TableCell>
                  <TableCell>{formatTk(s.balanceAfterMinor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
      {tab === 1 && (
        <Paper variant="outlined">
          <Box sx={{ p: 1, display: "flex", gap: 1 }}>
            <Button size="small" variant="outlined"
              component="a" href={`/api/v1/loans/${id}/statement?format=csv`}
              target="_blank" rel="noreferrer">
              Download CSV
            </Button>
          </Box>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Paid on</TableCell><TableCell>Reference</TableCell>
              <TableCell>Rail</TableCell><TableCell>Paid in</TableCell><TableCell>Outstanding after</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {stmt?.rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.paidOn}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>{r.reference}</TableCell>
                  <TableCell>{r.rail}</TableCell>
                  <TableCell>{formatTk(r.paidInMinor)}</TableCell>
                  <TableCell>{formatTk(r.outstandingAfterMinor)}</TableCell>
                </TableRow>
              ))}
              {stmt?.rows.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">No payments yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
      {tab === 2 && (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>Paid at</TableCell><TableCell>Amount</TableCell><TableCell>Rail</TableCell>
              <TableCell>Reference</TableCell><TableCell>Fineract txn</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.paidAt).toLocaleString()}</TableCell>
                  <TableCell>{formatTk(p.amountMinor)}</TableCell>
                  <TableCell><Chip size="small" label={p.rail} /></TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>
                    {p.utr ?? p.externalRef}
                  </TableCell>
                  <TableCell>{p.fineractTxnId ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Snackbar open={!!msg} autoHideDuration={5000} onClose={() => setMsg(null)}>
        <Alert severity="success" onClose={() => setMsg(null)}>{msg}</Alert>
      </Snackbar>
      <Snackbar open={!!err} autoHideDuration={6000} onClose={() => setErr(null)}>
        <Alert severity="error" onClose={() => setErr(null)}>{err}</Alert>
      </Snackbar>
    </Box>
  );
}
