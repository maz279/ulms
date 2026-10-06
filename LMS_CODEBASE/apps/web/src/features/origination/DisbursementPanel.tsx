import * as React from "react";
import { Box, Button, Chip, Stepper, Step, StepLabel, Alert, Typography } from "@mui/material";
import {
  prepareDisbursement, authorizeDisbursement, releaseDisbursement,
  getDisbursementByApplication, type DisbursementView,
} from "../../api/disbursements";
import { formatTk } from "../../api/money";

/**
 * Disbursement dual-auth panel (03 mod-approval): PREPARED → AUTHORIZED →
 * RELEASED with the distinct-officer chain enforced server-side. Every
 * action runs as the logged-in JWT user — attempts by the same officer are
 * rejected (409) by the backend; this panel surfaces those messages.
 */
export function DisbursementPanel({ appId, onReleased }: { appId: string; onReleased?: () => void }) {
  const [disb, setDisb] = React.useState<DisbursementView | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setDisb(await getDisbursementByApplication(appId).catch(() => null));
  }, [appId]);
  React.useEffect(() => { void refresh(); }, [refresh]);

  async function act(fn: () => Promise<DisbursementView>) {
    setBusy(true); setError(null);
    try {
      setDisb(await fn());
      if (onReleased) onReleased();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  const step = disb ? (disb.state === "PREPARED" ? 0 : disb.state === "AUTHORIZED" ? 1 : 2) : -1;

  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Typography variant="subtitle2">Disbursement (dual authorization)</Typography>
      {disb && (
        <>
          <Stepper activeStep={step} alternativeLabel>
            <Step><StepLabel>Prepared ({disb.preparedBy})</StepLabel></Step>
            <Step><StepLabel>Authorized ({disb.authorizedBy ?? "pending"})</StepLabel></Step>
            <Step><StepLabel>Released {disb.fineractTxnId ? `(txn #${disb.fineractTxnId})` : ""}</StepLabel></Step>
          </Stepper>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Chip size="small" label={`${formatTk(disb.amountMinor)} · ${disb.state}`}
              color={disb.state === "RELEASED" ? "success" : "default"} />
            {disb.state === "PREPARED" && (
              <Button size="small" variant="contained" disabled={busy}
                onClick={() => act(() => authorizeDisbursement(disb.id))}>
                Authorize (2nd officer)
              </Button>
            )}
            {disb.state === "AUTHORIZED" && (
              <Button size="small" variant="contained" color="success" disabled={busy}
                onClick={() => act(() => releaseDisbursement(disb.id))}>
                Release (3rd officer)
              </Button>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            Trail: {disb.trail.map((t) => `${t.action}→${t.actor}`).join(" · ") || "—"}
          </Typography>
        </>
      )}
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
}

/** Prepare button for SANCTION-stage rows (pipeline detail). */
export function PrepareDisbursementButton({ appId, onPrepared }: {
  appId: string; onPrepared?: () => void;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Button size="small" variant="outlined" disabled={busy} sx={{ justifySelf: "start" }}
        onClick={async () => {
          setBusy(true); setError(null);
          try {
            await prepareDisbursement(appId);
            if (onPrepared) onPrepared();
          } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
          } finally { setBusy(false); }
        }}>
        Prepare disbursement
      </Button>
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
}
