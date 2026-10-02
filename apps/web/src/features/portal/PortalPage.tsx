import * as React from "react";
import {
  Typography, Paper, Box, Button, Card, CardContent, Chip, Alert,
  TextField, MenuItem, Snackbar,
} from "@mui/material";
import { authHeaders } from "../../api/customers";
import { formatTk } from "../../api/money";

interface LoanCard { loanId: string; loanNo: string; outstandingMinor: number;
  emiMinor: number; nextDueOn: string | null; classification: string }
interface TrackerRow { appNo: string; stage: string; amountMinor: number; createdAt: string }
interface PayLine { paidAt: string; amountMinor: number; rail: string; reference: string }

/** Borrower portal thin slice (08 B1 W10): balance+EMI card, tracker, pay (redirect). */
export function PortalPage() {
  const [mobile, setMobile] = React.useState("+8801712345678");
  const [me, setMe] = React.useState<{ cifNo: string; nameEn: string; loans: LoanCard[] } | null>(null);
  const [tracker, setTracker] = React.useState<TrackerRow[]>([]);
  const [pay, setPay] = React.useState<PayLine[]>([]);
  const [selected, setSelected] = React.useState<LoanCard | null>(null);
  const [amount, setAmount] = React.useState("");
  const [rail, setRail] = React.useState("BKASH");
  const [railUrl, setRailUrl] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  // R10 P-D: OTP login (request → verify → sign in)
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState('');
  const [applyProduct, setApplyProduct] = React.useState('retail-personal');
  const [applyAmt, setApplyAmt] = React.useState('');
  const [docType, setDocType] = React.useState('');

  async function requestOtp() {
    setErr(null); setMsg(null);
    try {
      const res = await fetch('/api/v1/portal/otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, purpose: 'login' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail ?? `OTP request failed (${res.status})`);
      setOtpSent(true);
      if (typeof data.devCode === 'string') {
        setOtpCode(data.devCode);
        setMsg(`Dev OTP auto-filled (${data.devCode}) — production delivers by SMS`);
      } else {
        setMsg('Code sent — check your SMS');
      }
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  async function verifyOtp() {
    setErr(null);
    try {
      const res = await fetch('/api/v1/portal/otp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, code: otpCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail ?? `OTP verify failed (${res.status})`);
      await login();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  async function login() {
    setErr(null);
    try {
      const res = await fetch(`/api/v1/portal/me?mobile=${encodeURIComponent(mobile)}`,
        { headers: authHeaders() });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? `Login failed (${res.status})`);
      const data = await res.json();
      setMe(data);
      setSelected(data.loans[0] ?? null);
      const tr = await fetch(`/api/v1/portal/me/application?cif=${data.cifNo}`,
        { headers: authHeaders() });
      if (tr.ok) setTracker((await tr.json()).data ?? []);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  async function pickLoan(card: LoanCard) {
    setSelected(card);
    const res = await fetch(
      `/api/v1/portal/me/payments?loanId=${card.loanId}&mobile=${encodeURIComponent(mobile)}`,
      { headers: authHeaders() });
    if (res.ok) setPay((await res.json()).data ?? []);
  }

  async function onPortalApply() {
    if (!me || !applyAmt) return;
    setErr(null);
    try {
      const res = await fetch('/api/v1/portal/me/applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, productCode: applyProduct, amountMinor: Math.round(parseFloat(applyAmt) * 100), tenorMonths: 24, incomeMinor: 60000000 }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? 'Apply failed');
      const a = await res.json();
      setMsg(`Application ${a.appNo} submitted — track it below`);
      setApplyAmt('');
      const tr = await fetch(`/api/v1/portal/me/application?cif=${me.cifNo}`, { headers: {} });
      if (tr.ok) setTracker((await tr.json()).data ?? []);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }
  async function onPortalUpload() {
    if (!me || !docType) return;
    setErr(null);
    try {
      const sha256 = 'a'.repeat(64);  // demo digest — the real flow hashes the picked file client-side
      const res = await fetch('/api/v1/portal/me/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, docType, sha256, sizeBytes: 204800 }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? 'Upload failed');
      setMsg(`${docType} uploaded — scan CLEAN`);
      setDocType('');
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }
  async function onPay() {
    if (!selected || !amount) return;
    setErr(null);
    try {
      const res = await fetch("/api/v1/portal/me/payments/initiate", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ loanId: selected.loanId,
          amountMinor: Math.round(parseFloat(amount) * 100), rail }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? "Initiate failed");
      const intent = await res.json();
      setRailUrl(intent.railUrl);
      setMsg(`Checkout created (${intent.rail}) — confirming via the rail's callback`);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }

  return (
    <Box sx={{ display: "grid", gap: 2, maxWidth: 900, margin: "0 auto" }}>
      <Paper sx={{ p: 3, background: "linear-gradient(135deg,#3F51B5 0%,#5C6BC0 100%)", color: "#fff" }}>
        <Typography variant="h5">ULMS Borrower Portal</Typography>
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          ABC Bank · your loans, your payments — no branch visit needed
        </Typography>
      </Paper>

      {!me ? (
        <Paper sx={{ p: 3, display: "flex", gap: 2, alignItems: "center" }}>
          <TextField size="small" label="Registered mobile" value={mobile}
            sx={{ maxWidth: 260 }} onChange={(e) => setMobile(e.target.value)} />
          {!otpSent ? (
            <Button variant="outlined" onClick={requestOtp}>Get code</Button>
          ) : (
            <>
              <TextField size="small" label="OTP code" value={otpCode}
                sx={{ maxWidth: 120 }} onChange={(e) => setOtpCode(e.target.value)} />
              <Button variant="contained" onClick={verifyOtp}>Verify & sign in</Button>
            </>
          )}
          <Button variant="text" onClick={login}>Sign in without OTP (pilot)</Button>
          {msg && <Alert severity="info">{msg}</Alert>}
          {err && <Alert severity="error">{err}</Alert>}
        </Paper>
      ) : (
        <>
          <Typography variant="subtitle1">Welcome, {me.nameEn} ({me.cifNo})</Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {me.loans.map((l) => (
              <Card key={l.loanId} variant="outlined"
                sx={{ minWidth: 260, cursor: "pointer",
                      border: selected?.loanId === l.loanId ? "2px solid #3F51B5" : undefined }}
                onClick={() => void pickLoan(l)}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">{l.loanNo}</Typography>
                  <Typography variant="h6">{formatTk(l.outstandingMinor, { full: true })}</Typography>
                  <Typography variant="body2">
                    EMI {formatTk(l.emiMinor)} · next {l.nextDueOn ?? "—"}
                  </Typography>
                  <Chip size="small" sx={{ mt: 1 }}
                    color={l.classification.startsWith("STD") ? "success" : "warning"}
                    label={l.classification} />
                </CardContent>
              </Card>
            ))}
            {me.loans.length === 0 && <Alert severity="info">No active loans.</Alert>}
          </Box>

          {selected && (
            <Paper sx={{ p: 2, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <TextField size="small" type="number" label={`Pay amount (৳) — EMI ${formatTk(selected.emiMinor)}`}
                value={amount} sx={{ maxWidth: 260 }} onChange={(e) => setAmount(e.target.value)} />
              <TextField select size="small" value={rail} sx={{ width: 110 }}
                onChange={(e) => setRail(e.target.value)}>
                {["BKASH", "NAGAD", "BEFTN"].map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
              <Button variant="contained" onClick={onPay}>Pay now</Button>
              <Button size="small" variant="outlined" component="a"
                href={`/api/v1/portal/me/loans/${selected.loanId}/statement.csv?mobile=${encodeURIComponent(mobile)}`}
                target="_blank" rel="noreferrer">
                Download statement
              </Button>
              <Button size="small" variant="outlined" component="a"
                href={`/api/v1/certificates/tax/${new Date().getFullYear()}?cif=${me.cifNo}`}
                target="_blank" rel="noreferrer">
                Tax certificate
              </Button>
            </Paper>
          )}
          {railUrl && (
            <Alert severity="info" onClose={() => setRailUrl(null)}>
              Redirecting to rail: {railUrl} — card data never touches ULMS; the posting
              happens via the rail's signed callback.
            </Alert>
          )}

          <Paper variant='outlined' sx={{ p: 2 }}>
            <Typography variant='subtitle2'>New application (self-service)</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField select size='small' label='Product' value={applyProduct} sx={{ width: 170 }}
                onChange={(e) => setApplyProduct(e.target.value)}>
                {['retail-personal', 'sme-term', 'krishi', 'retail-home'].map((pcode) => (
                  <MenuItem key={pcode} value={pcode}>{pcode}</MenuItem>
                ))}
              </TextField>
              <TextField size='small' type='number' label='Amount (৳)' value={applyAmt} sx={{ width: 140 }}
                onChange={(e) => setApplyAmt(e.target.value)} />
              <Button variant='contained' disabled={!applyAmt} onClick={onPortalApply}>Apply</Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField select size='small' label='Upload document' value={docType} sx={{ width: 170 }}
                onChange={(e) => setDocType(e.target.value)}>
                {['NID_FRONT', 'PHOTOGRAPH', 'BANK_STATEMENT', 'INCOME_PROOF'].map((d) => (
                  <MenuItem key={d} value={d}>{d}</MenuItem>
                ))}
              </TextField>
              <Button size='small' variant='outlined' disabled={!docType} onClick={onPortalUpload}>Upload</Button>
            </Box>
          </Paper>
          {tracker.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2">Application tracker</Typography>
              {tracker.map((t) => (
                <Box key={t.appNo} sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{t.appNo}</Typography>
                  <Chip size="small" label={t.stage}
                    color={t.stage === "DISBURSED" ? "success" : "warning"} />
                  <Typography variant="caption">{formatTk(t.amountMinor)}</Typography>
                </Box>
              ))}
            </Paper>
          )}

          {pay.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2">Recent payments</Typography>
              {pay.slice(0, 5).map((p, i) => (
                <Box key={i} sx={{ display: "flex", gap: 2, mt: 0.5 }}>
                  <Typography variant="body2">{new Date(p.paidAt).toLocaleDateString()}</Typography>
                  <Typography variant="body2"><b>{formatTk(p.amountMinor)}</b> via {p.rail}</Typography>
                  <Typography variant="caption" sx={{ fontFamily: "monospace" }}>{p.reference}</Typography>
                </Box>
              ))}
            </Paper>
          )}
        </>
      )}

      <Snackbar open={!!msg} autoHideDuration={5000} onClose={() => setMsg(null)}>
        <Alert severity="success" onClose={() => setMsg(null)}>{msg}</Alert>
      </Snackbar>
    </Box>
  );
}
