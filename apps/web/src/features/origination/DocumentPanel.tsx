import * as React from "react";
import {
  Button, Chip, Typography, Box, Table, TableHead, TableRow, TableCell, TableBody, Alert,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { uploadDocument, listDocuments, type ApplicationDocumentView } from "../../api/applications";

/**
 * Document upload panel (PLANNING/03 mod-origination / 07 §4): file picker →
 * multipart upload → checksummed metadata list. Used on the wizard's
 * Documents step (after submit) and the pipeline detail.
 */
export function DocumentPanel({ appId }: { appId: string }) {
  const [docs, setDocs] = React.useState<ApplicationDocumentView[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const refresh = React.useCallback(async () => {
    try { setDocs(await listDocuments(appId)); } catch { /* 404 until first upload */ }
  }, [appId]);
  React.useEffect(() => { void refresh(); }, [refresh]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setError(null);
    try {
      const docType = file.name.toUpperCase().includes("NID") ? "NID_PHOTO"
        : file.name.toUpperCase().includes("INCOME") ? "INCOME_PROOF"
        : file.name.toUpperCase().includes("STATEMENT") ? "BANK_STATEMENT" : "OTHER";
      await uploadDocument(appId, docType, file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const scanColor = (s: string) =>
    s === "CLEAN" ? "success" : s === "INFECTED" ? "error" : "warning";

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <input ref={inputRef} type="file" hidden onChange={onPick} />
      <Button variant="outlined" startIcon={<UploadFileIcon />} disabled={busy}
        onClick={() => inputRef.current?.click()} sx={{ justifySelf: "start" }}>
        {busy ? "Uploading…" : "Upload document"}
      </Button>
      <Typography variant="caption" color="text.secondary">
        NID photo · income proof · bank statement — PDF/JPG/PNG, virus-scan + checksum (06 §5)
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {docs.length > 0 && (
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Type</TableCell><TableCell>Checksum (sha256)</TableCell>
            <TableCell>Size</TableCell><TableCell>Scan</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {docs.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.docType}</TableCell>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>
                  {d.sha256.slice(0, 16)}…
                </TableCell>
                <TableCell>{(d.sizeBytes / 1024).toFixed(1)} KB</TableCell>
                <TableCell><Chip size="small" color={scanColor(d.scanStatus) as any} label={d.scanStatus} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}
