import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, MenuItem, Button, Snackbar, Alert, Chip, Box,
} from "@mui/material";
import { createCustomer, listCustomers, type CustomerView } from "../../api/customers";
import { pick } from "../../i18n/bilingual";
import { PageHeader } from "../../shell/PageHeader";
import { Kpi, KpiRow, StatusChip, statusTone } from "../../shell/Kpi";

/**
 * Walking-slice page (G0): list + create customer through the real API.
 * Prototype contract preserved: list grid + "New customer" flow + toasts.
 */
export function CustomerPage() {
  const nav = useNavigate();
  const [rows, setRows] = React.useState<CustomerView[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    nameEn: "", nameBn: "", mobile: "+8801", segment: "RETAIL", branchCode: "BR-001",
  });
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      const page = await listCustomers();
      setRows(page.data);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    }
  }, []);

  React.useEffect(() => { void refresh(); }, [refresh]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const created = await createCustomer({
        nameEn: form.nameEn, nameBn: form.nameBn || undefined,
        segment: form.segment as CustomerView["segment"],
        mobile: form.mobile, branchCode: form.branchCode,
      });
      setOkMsg(`${created.cifNo} created — Fineract client #${created.fineractClientId ?? "pending"}`);
      setForm((f) => ({ ...f, nameEn: "", nameBn: "" }));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const verified = rows.filter((c) => c.kycStatus === "VERIFIED").length;

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <PageHeader
        crumbs={[{ label: "Customer & Onboarding" }, { label: "Customers" }]}
        title="Customer Directory"
        sub="CIF master · NID e-KYC · branch-scoped visibility"
        badge={`${rows.length} on file`}
      />

      <KpiRow>
        <Kpi tone="primary" label="Customers on file" value={rows.length} />
        <Kpi tone="ok" label="KYC verified" value={verified}
          delta={{ dir: "flat", text: `${rows.length ? Math.round((verified / rows.length) * 100) : 0}% of book` }} />
        <Kpi tone="warn" label="KYC pending" value={rows.length - verified} />
        <Kpi tone="info" label="SME segment" value={rows.filter((c) => c.segment === "SME").length} />
      </KpiRow>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>New customer</Typography>
        <Box component="form" onSubmit={submit} sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr auto" }, alignItems: "center" }}>
          <TextField required size="small" label="Full name (English)"
            value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
          <TextField size="small" label="Name (Bangla)"
            value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} />
          <TextField required size="small" label="Mobile (+880…)" placeholder="+8801712345678"
            value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <TextField select size="small" label="Segment" value={form.segment}
            onChange={(e) => setForm({ ...form, segment: e.target.value })}>
            {["RETAIL", "SME", "CORPORATE", "AGRI"].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained" disabled={busy} sx={{ justifySelf: "start" }}>
            {busy ? "Creating…" : "Create customer"}
          </Button>
        </Box>
      </Paper>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>CIF</TableCell><TableCell>Name</TableCell><TableCell>Segment</TableCell>
              <TableCell>Mobile</TableCell><TableCell>Branch</TableCell>
              <TableCell>Fineract</TableCell><TableCell>KYC</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id} hover sx={{ cursor: "pointer" }}
                onClick={() => nav(`/customer/${c.cifNo}`)}>
                <TableCell sx={{ fontFamily: "monospace" }}>{c.cifNo}</TableCell>
                <TableCell>{pick(c.name)}</TableCell>
                <TableCell><Chip size="small" label={c.segment} /></TableCell>
                <TableCell>{c.mobile}</TableCell>
                <TableCell>{c.branchCode}</TableCell>
                <TableCell>{c.fineractClientId ?? "—"}</TableCell>
                <TableCell><StatusChip tone={statusTone(c.kycStatus)} label={c.kycStatus} /></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={7} align="center">No customers yet — create the first.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Snackbar open={!!okMsg} autoHideDuration={5000} onClose={() => setOkMsg(null)}>
        <Alert severity="success" onClose={() => setOkMsg(null)}>{okMsg}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}
