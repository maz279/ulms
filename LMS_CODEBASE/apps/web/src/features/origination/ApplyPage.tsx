import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Stepper, Step, StepLabel, Typography, Paper, TextField, MenuItem, Button,
  Box, Alert, Chip, FormControlLabel, Checkbox,
} from "@mui/material";
import {
  draftApplication, submitApplication, patchApplication, emiMonthly, dbrPercent,
} from "../../api/applications";
import { listCustomers, type CustomerView } from "../../api/customers";
import { financeStep, loanProductStep } from "../../api/schemas";
import { formatTk } from "../../api/money";
import { PageHeader } from "../../shell/PageHeader";
import { DocumentPanel } from "./DocumentPanel";

/** 6-step apply wizard — the prototype contract (PLANNING/07 §4): live EMI + DBR oracle, declaration gate. */
const STEPS = ["Personal", "Contact & address", "Employment & finance", "Loan & product", "Documents", "Review & submit"];
const RATE = 0.1199;   // shared with backend fixtures (09 §3)
const DRAFT_KEY = "ulms.apply.draft.v1";   // local autosave slot — "Draft saved — resume anytime"
const PATCH_MS = 30_000;                    // server-draft PATCH cadence (07 §4)

type FormState = {
  customerId: string; mobile: string; address: string;
  income: number; existingEmis: number; employer: string;
  product: string; amountLakh: number; tenor: number;
  rateType: "FIXED" | "FLOATING"; branch: string; declaration: boolean;
};

const INITIAL_FORM: FormState = {
  customerId: "", mobile: "", address: "",
  income: 185000, existingEmis: 42000, employer: "Rashida Traders",
  product: "sme-term", amountLakh: 15, tenor: 48, rateType: "FIXED",
  branch: "BR-001", declaration: false,
};

export function ApplyPage() {
  const nav = useNavigate();
  const [step, setStep] = React.useState(0);
  const [submittedAppId, setSubmittedAppId] = React.useState<string | null>(null);
  const [customers, setCustomers] = React.useState<CustomerView[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [f, setF] = React.useState<FormState>(INITIAL_FORM);
  const [draftRestored, setDraftRestored] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [serverDraftId, setServerDraftId] = React.useState<string | null>(null);
  const [serverSavedAt, setServerSavedAt] = React.useState<Date | null>(null);

  // Local autosave restore (mount): previous session's draft rehydrates form + step.
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { f?: Partial<FormState>; step?: number; serverDraftId?: string };
        if (d.f) setF((prev) => ({ ...prev, ...d.f, declaration: false })); // consent never persists
        if (typeof d.step === "number" && d.step >= 0 && d.step <= 4) setStep(d.step);
        if (d.serverDraftId) setServerDraftId(d.serverDraftId);
        setDraftRestored(true);
      }
    } catch { /* corrupt draft — start fresh */ }
  }, []);

  // Local autosave (debounced): every form/step change lands until submitted.
  React.useEffect(() => {
    if (submittedAppId) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(
          { f: { ...f, declaration: false }, step, serverDraftId, savedAt: new Date().toISOString() }));
        setSavedAt(new Date());
      } catch { /* storage full/blocked — wizard still works in-session */ }
    }, 600);
    return () => clearTimeout(t);
  }, [f, step, serverDraftId, submittedAppId]);

  React.useEffect(() => {
    listCustomers().then((page) => setCustomers(page.data)).catch(() => setCustomers([]));
  }, []);

  const amountMinor = Math.round(f.amountLakh * 100000 * 100);
  const emi = emiMonthly(amountMinor, f.tenor, f.rateType === "FLOATING" ? RATE + 0.005 : RATE);
  const dbr = dbrPercent(f.income, f.existingEmis, emi / 100);
  const dbrColor = dbr > 50 ? "error" : dbr > 40 ? "warning" : "success";

  // Server-draft lifecycle (07 §4): create on first valid product data, then
  // PATCH the draft on the 30s cadence until submit consumes it. Income rides
  // along from the finance step (G2: assessment needs it).
  React.useEffect(() => {
    if (submittedAppId || serverDraftId || step < 3 || !f.customerId) return;
    if (!loanProductStep.safeParse({ productCode: f.product, amountLakh: f.amountLakh,
        tenor: f.tenor, rateType: f.rateType }).success) return;
    draftApplication({ customerId: f.customerId, productCode: f.product, amountMinor,
      tenorMonths: f.tenor, rateType: f.rateType, branchCode: f.branch,
      incomeMinor: f.income * 100, existingEmiMinor: f.existingEmis * 100 })
      .then((app) => setServerDraftId(app.id))
      .catch(() => { /* offline — local autosave still protects the entry */ });
  }, [step, f.customerId, f.product, f.amountLakh, f.tenor, f.rateType, f.income, f.existingEmis, amountMinor, serverDraftId, submittedAppId]);

  React.useEffect(() => {
    if (!serverDraftId || submittedAppId) return;
    const interval = setInterval(() => {
      patchApplication(serverDraftId, { productCode: f.product, amountMinor,
        tenorMonths: f.tenor, rateType: f.rateType,
        incomeMinor: f.income * 100, existingEmiMinor: f.existingEmis * 100 })
        .then(() => setServerSavedAt(new Date()))
        .catch(() => { /* stage moved on — PATCH 409s are expected then */ });
    }, PATCH_MS);
    return () => clearInterval(interval);
  }, [serverDraftId, submittedAppId, f.product, amountMinor, f.tenor, f.rateType, f.income, f.existingEmis]);

  /** Zod step gates (07 §4 parity): blocks Next with the first field error. */
  function next() {
    if (step === 2) {
      const parsed = financeStep.safeParse({ income: f.income, existingEmis: f.existingEmis });
      if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    }
    if (step === 3) {
      const parsed = loanProductStep.safeParse({ productCode: f.product,
        amountLakh: f.amountLakh, tenor: f.tenor, rateType: f.rateType });
      if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    }
    setError(null);
    setStep(step + 1);
  }

  async function submit() {
    setError(null);
    if (!f.declaration) { setError("Declaration & CIB consent are mandatory before submit"); return; }
    try {
      let appId = serverDraftId;
      const incomeBody = { incomeMinor: f.income * 100, existingEmiMinor: f.existingEmis * 100 };
      if (appId) {   // sync final product fields into the server draft before submit
        await patchApplication(appId, { productCode: f.product, amountMinor,
          tenorMonths: f.tenor, rateType: f.rateType, ...incomeBody });
      } else {
        const app = await draftApplication({ customerId: f.customerId, productCode: f.product,
          amountMinor, tenorMonths: f.tenor, rateType: f.rateType, branchCode: f.branch,
          ...incomeBody });
        appId = app.id;
      }
      // G2 flow: CIB pull + scoring run server-side; the result is CPV (proceed)
      // or SCREENING with a persisted AUTO_DECLINE score.
      const result = await submitApplication(appId);
      if (result.stage === "SCREENING") {
        setError(`Auto-declined at scoring — DBR ${result.dbrPercent ?? "?"}% exceeds policy or scorecard grade D. See pipeline for the score.`);
        setSubmittedAppId(null);
        return;
      }
      localStorage.removeItem(DRAFT_KEY);   // draft consumed → stop autosaving
      setSubmittedAppId(appId);            // stay for the Documents step (upload after submit)
      setStep(4);                          // jump to documents
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <PageHeader
        crumbs={[{ label: "Loan Origination (LOS)" }, { label: "New Application" }]}
        title="New Loan Application"
        sub="NID e-KYC auto-fill · live EMI & DBR oracle · 30s draft autosave"
        badge={`Step ${step + 1} of ${STEPS.length}`}
      />
      {draftRestored && !submittedAppId && (
        <Alert severity="info" onClose={() => setDraftRestored(false)}>
          Draft restored from your last session — continue where you left off.
        </Alert>
      )}
      <Stepper activeStep={step} alternativeLabel>
        {STEPS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
      </Stepper>
      {!submittedAppId && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            size="small" variant="outlined"
            color={savedAt ? "success" : "default"}
            label={savedAt
              ? `Draft saved ${savedAt.toLocaleTimeString()} — resume anytime`
              : "Draft autosave armed"}
          />
          {serverDraftId && (
            <Chip
              size="small" variant="outlined"
              color={serverSavedAt ? "success" : "default"}
              label={serverSavedAt
                ? `Server draft synced ${serverSavedAt.toLocaleTimeString()}`
                : "Server draft created"}
            />
          )}
        </Box>
      )}
      <Paper sx={{ p: 3, display: "grid", gap: 2 }}>
        {step === 0 && (<>
          <TextField select required size="small" label="Customer (CIF)" value={f.customerId}
            onChange={(e) => setF({ ...f, customerId: e.target.value })} sx={{ maxWidth: 420 }}>
            {customers.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.cifNo} · {c.name.en}</MenuItem>
            ))}
          </TextField>
          {customers.length === 0 && <Alert severity="info">Create a customer first (Customers page).</Alert>}
        </>)}
        {step === 1 && (<>
          <TextField size="small" label="Mobile" value={f.mobile} sx={{ maxWidth: 300 }}
            onChange={(e) => setF({ ...f, mobile: e.target.value })} />
          <TextField size="small" label="Present address" value={f.address} fullWidth
            onChange={(e) => setF({ ...f, address: e.target.value })} />
        </>)}
        {step === 2 && (<>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, maxWidth: 700 }}>
            <TextField size="small" type="number" label="Monthly income (৳)" value={f.income}
              onChange={(e) => setF({ ...f, income: +e.target.value || 0 })} />
            <TextField size="small" type="number" label="Existing EMIs (৳/mo)" value={f.existingEmis}
              onChange={(e) => setF({ ...f, existingEmis: +e.target.value || 0 })} />
            <TextField size="small" label="Employer / Business" value={f.employer}
              onChange={(e) => setF({ ...f, employer: e.target.value })} />
          </Box>
          <Alert severity={dbr > 50 ? "error" : "success"}>
            Live DBR: <b>{dbr.toFixed(1)}%</b> — policy max 50% (green &lt; 40%, yellow 40–50%, red &gt; 50%)
          </Alert>
        </>)}
        {step === 3 && (<>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, maxWidth: 800 }}>
            <TextField select size="small" label="Product" value={f.product}
              onChange={(e) => setF({ ...f, product: e.target.value })}>
              <MenuItem value="sme-term">SME Term Loan</MenuItem>
              <MenuItem value="retail-personal">Personal Loan</MenuItem>
              <MenuItem value="krishi">Krishi (agri)</MenuItem>
              <MenuItem value="islamic-murabaha">Islamic Murabaha</MenuItem>
            </TextField>
            <TextField size="small" type="number" label="Amount (৳ Lakh)" value={f.amountLakh}
              onChange={(e) => setF({ ...f, amountLakh: +e.target.value || 0 })} />
            <TextField size="small" type="number" label="Tenor (months)" value={f.tenor}
              onChange={(e) => setF({ ...f, tenor: +e.target.value || 1 })} />
            <TextField select size="small" label="Rate type" value={f.rateType}
              onChange={(e) => setF({ ...f, rateType: e.target.value as "FIXED" | "FLOATING" })}>
              <MenuItem value="FIXED">Fixed</MenuItem>
              <MenuItem value="FLOATING">Floating (BLR+spread)</MenuItem>
            </TextField>
          </Box>
          <Alert severity="info">
            EMI (reducing balance): <b>{formatTk(emi, { full: true })}</b>/mo · Principal {formatTk(amountMinor)} · total interest ≈ {formatTk(emi * f.tenor - amountMinor)}
          </Alert>
        </>)}
        {step === 4 && submittedAppId ? (<>
          <Alert severity="success">Application submitted — CIB pulled, scoring passed, stage CPV. Attach documents now (checksummed, virus-scanned).</Alert>
          <DocumentPanel appId={submittedAppId} />
          <Button variant="contained" onClick={() => nav("/pipeline")} sx={{ justifySelf: "start" }}>
            Go to pipeline (CPV) →
          </Button>
        </>) : step === 4 ? (<>
          <Alert severity="info">Document upload becomes available immediately after submit — NID photo, income proof, bank statement (MinIO-backed, checksummed).</Alert>
          <Chip label="virus-scan + OCR pipeline armed" size="small" />
        </>) : null}
        {step === 5 && (<>
          <Box sx={{ display: "grid", gap: 1, maxWidth: 520 }}>
            <Typography variant="body2">Customer: {customers.find((c) => c.id === f.customerId)?.cifNo ?? "—"}</Typography>
            <Typography variant="body2">Product: {f.product} · {formatTk(amountMinor)} / {f.tenor}m · {f.rateType}</Typography>
            <Typography variant="body2">EMI {formatTk(emi, { full: true })} · DBR <Chip color={dbrColor} size="small" label={`${dbr.toFixed(1)}%`} /></Typography>
          </Box>
          <FormControlLabel control={<Checkbox checked={f.declaration}
            onChange={(e) => setF({ ...f, declaration: e.target.checked })} />}
            label="I confirm the information is true; Bangladesh Bank CIB consent granted." />
        </>)}

        {error && <Alert severity="error">{error}</Alert>}

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button disabled={step === 0} onClick={() => { setError(null); setStep(step - 1); }}>‹ Back</Button>
          {step < STEPS.length - 1
            ? <Button variant="contained" disabled={step === 0 && !f.customerId}
                onClick={next}>Next ›</Button>
            : <Button variant="contained" onClick={submit} disabled={!f.customerId}>Submit application ✓</Button>}
        </Box>
      </Paper>
    </Box>
  );
}
