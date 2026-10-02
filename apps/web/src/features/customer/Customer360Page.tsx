import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Typography, Paper, Tabs, Tab, Box, Button, Table, TableHead, TableRow,
  TableCell, TableBody, Chip, List, ListItem, ListItemText, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert,
} from "@mui/material";
import { getCustomer360, kycRefresh, screenCustomer, type Customer360 } from "../../api/customers";
import { pick } from "../../i18n/bilingual";
import { formatTk } from "../../api/money";
import { PageHeader } from "../../shell/PageHeader";

/** Customer 360° — prototype contract: head band + tabs (profile / applications / actions). */
export function Customer360Page() {
  const { cif } = useParams();
  const nav = useNavigate();
  const [c360, setC360] = React.useState<Customer360 | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [tab, setTab] = React.useState(0);
  const [kycOpen, setKycOpen] = React.useState(false);
  const [nid, setNid] = React.useState("");
  const [dob, setDob] = React.useState("1990-01-01");
  const [error, setError] = React.useState<string | null>(null);
  const [screenMsg, setScreenMsg] = React.useState<string | null>(null);

  const reload = React.useCallback(() => {
    if (!cif) return;
    getCustomer360(cif).then((data) => { setC360(data); setNotFound(false); })
      .catch(() => setNotFound(true));
  }, [cif]);
  React.useEffect(() => { reload(); }, [reload]);

  if (notFound || (!c360 && !cif)) {
    return <Typography variant="body1">Customer {cif} not found.</Typography>;
  }
  if (!c360) return <Typography variant="body2">Loading…</Typography>;

  const c = c360.customer;

  async function onVerify() {
    setError(null);
    try {
      const after = await kycRefresh(c360!.id, nid, dob);
      setKycOpen(false);
      reload();
      setScreenMsg(`e-KYC ${after.kycStatus}${after.kycStatus === "VERIFIED" ? " — NID matched (mock NIDW)" : ""}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onScreen() {
    setScreenMsg(null);
    try {
      const result = await screenCustomer(c360!.id);
      setScreenMsg(result.clear
        ? "Screening CLEAR — no sanctions/PEP hits."
        : `${result.hits.length} hit(s) recorded — compliance review (P2 workflow).`);
      reload();
    } catch (e) {
      setScreenMsg(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <PageHeader
        crumbs={[{ label: "Customer & Onboarding", to: "/customers" }, { label: "Customer 360°" }]}
        title={c.nameBn ? pick({ en: c.nameEn, bn: c.nameBn }) : c.nameEn}
        sub={`${c360.cifNo} · ${c.segment} · ${c.branchCode}${c.nidMasked ? ` · NID ${c.nidMasked}` : ""} · Fineract client ${c.fineractClientId ?? "—"}`}
        badge={c.kycStatus}
        actions={<Button variant="contained" onClick={() => nav("/apply")}>✚ New Application</Button>}
      />

      {screenMsg && <Alert severity="info" onClose={() => setScreenMsg(null)}>{screenMsg}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Profile" />
        <Tab label={`Applications (${c360.applications.length})`} />
        <Tab label="Compliance" />
        <Tab label="Actions" />
      </Tabs>

      {tab === 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <List dense>
            <ListItem><ListItemText primary="Name (EN)" secondary={c.nameEn} /></ListItem>
            <ListItem><ListItemText primary="Name (Bangla)" secondary={c.nameBn ?? "—"} /></ListItem>
            <ListItem><ListItemText primary="Mobile" secondary={c.mobile} /></ListItem>
            <ListItem><ListItemText primary="Branch" secondary={c.branchCode} /></ListItem>
            <ListItem><ListItemText primary="Fineract client" secondary={c.fineractClientId ?? "—"} /></ListItem>
            <ListItem><ListItemText primary="KYC status" secondary={c.kycStatus} /></ListItem>
            <ListItem><ListItemText primary="NID (masked)" secondary={c.nidMasked ?? "—"} /></ListItem>
          </List>
        </Paper>
      )}
      {tab === 1 && (
        <Paper variant="outlined">
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>App</TableCell><TableCell>Stage</TableCell>
              <TableCell>Amount</TableCell><TableCell>Tenor</TableCell><TableCell>Created</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {c360.applications.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ fontFamily: "monospace" }}>{a.appNo}</TableCell>
                  <TableCell><Chip size="small" label={a.stage} /></TableCell>
                  <TableCell>{formatTk(a.amountMinor)}</TableCell>
                  <TableCell>{a.tenorMonths}m</TableCell>
                  <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {c360.applications.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center">No applications yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
      {tab === 2 && (
        <Box sx={{ display: "grid", gap: 2 }}>
          <Paper variant="outlined">
            <Typography variant="subtitle2" sx={{ p: 1.5 }}>e-KYC history (kyc_check)</Typography>
            <Table size="small">
              <TableBody>
                {c360.kycChecks.map((k, i) => (
                  <TableRow key={i}>
                    <TableCell><Chip size="small"
                      color={k.status === "VERIFIED" ? "success" : k.status === "ERROR" ? "warning" : "error"}
                      label={k.status} /></TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>{k.referenceId ?? "—"}</TableCell>
                    <TableCell>{new Date(k.checkedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {c360.kycChecks.length === 0 && (
                  <TableRow><TableCell align="center">No e-KYC attempts yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
          <Paper variant="outlined">
            <Typography variant="subtitle2" sx={{ p: 1.5 }}>Screening hits (sanctions / PEP)</Typography>
            <Table size="small">
              <TableBody>
                {c360.screeningHits.map((h, i) => (
                  <TableRow key={i}>
                    <TableCell><Chip size="small" color="error" label={h.listName} /></TableCell>
                    <TableCell>{h.matchedName}</TableCell>
                    <TableCell>{new Date(h.checkedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {c360.screeningHits.length === 0 && (
                  <TableRow><TableCell align="center">No hits recorded.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}
      {tab === 3 && (
        <Paper variant="outlined" sx={{ p: 2, display: "grid", gap: 1 }}>
          <Button onClick={() => nav("/apply")} variant="outlined" sx={{ justifySelf: "start" }}>New application</Button>
          <Button onClick={() => { setError(null); setKycOpen(true); }} variant="outlined"
            sx={{ justifySelf: "start" }}>Verify KYC (NID e-KYC)</Button>
          <Button onClick={onScreen} variant="outlined" sx={{ justifySelf: "start" }}>Run screening (sanctions/PEP)</Button>
          <Button disabled variant="outlined" sx={{ justifySelf: "start" }}>CIB inquiry (P2)</Button>
        </Paper>
      )}

      <Dialog open={kycOpen} onClose={() => setKycOpen(false)}>
        <DialogTitle>Verify KYC — NID e-KYC (mock NIDW)</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 1, minWidth: 340 }}>
          <TextField autoFocus size="small" label="NID (10/13/17 digits)" value={nid}
            onChange={(e) => setNid(e.target.value)} />
          <TextField size="small" type="date" label="Date of birth" value={dob}
            InputLabelProps={{ shrink: true }} onChange={(e) => setDob(e.target.value)} />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setKycOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onVerify} disabled={!/^\d{10}$|^\d{13}$|^\d{17}$/.test(nid)}>
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
