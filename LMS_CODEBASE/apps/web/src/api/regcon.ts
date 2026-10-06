/** Regcon API client (P4): returns board, generation, sign-off chain, WORM
 *  file export, submission calendar, ECL runway, Basel CAR, reporting read model. */
import { authHeaders } from "./customers";

export interface ReturnEntry {
  code: string;
  description: string;
  frequency: string;          // MONTHLY | QUARTERLY | ANNUAL | CONTINUOUS
  nextDue: string | null;
  status: string;             // Filed | In sign-off | Staged | Live | Not started
  latestPeriod: string | null;
  returnId: string | null;
  rowCount: number;
  fileSha256: string | null;
  preparer: string | null;
  checker: string | null;
  complianceOfficer: string | null;
}

export interface RegconKpis {
  dueIn30Days: number;
  filedTotal: number;
  onTimeStreak: number;
  carPercent: number | null;
  carFloorPercent: number;
  eclRunwayMonths: number;
  eclMandatoryFrom: string;
}

export interface RegconBoard {
  today: string;
  entries: ReturnEntry[];
  kpis: RegconKpis;
}

export async function getReturnsBoard(): Promise<RegconBoard> {
  const res = await fetch("/api/v1/compliance/returns", { headers: authHeaders() });
  if (!res.ok) throw new Error(`Returns board failed (${res.status})`);
  return res.json();
}

export interface GenerateResult {
  id: string; code: string; period: string; status: string;
  rowCount: number; fileSha256: string; fileFormat: string;
}

export async function generateReturn(code: string, period?: string): Promise<GenerateResult> {
  const q = period ? `?period=${encodeURIComponent(period)}` : "";
  const res = await fetch(`/api/v1/compliance/returns/${encodeURIComponent(code)}/generate${q}`, {
    method: "POST", headers: authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail ?? `Generate failed (${res.status})`);
  return body;
}

export async function signoffCheck(id: string): Promise<{ status: string; checker: string }> {
  const res = await fetch(`/api/v1/compliance/returns/${id}/signoff/check`, {
    method: "POST", headers: authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail ?? `Check failed (${res.status})`);
  return body;
}

export async function signoffFile(id: string): Promise<{ status: string; submittedAt: string }> {
  const res = await fetch(`/api/v1/compliance/returns/${id}/signoff/file`, {
    method: "POST", headers: authHeaders(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail ?? `File failed (${res.status})`);
  return body;
}

/** WORM file download — the API renders money (07 §5); the browser just saves bytes. */
export async function downloadReturnFile(entry: ReturnEntry): Promise<void> {
  const res = await fetch(`/api/v1/compliance/returns/${entry.returnId}/file`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`File download failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${entry.code.replace("/", "-")}-${entry.latestPeriod}.${entry.code.startsWith("CIB") ? "txt" : "csv"}`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface CalendarDue { code: string; dueDate: string; period: string }

export async function getRegconCalendar(months = 6): Promise<CalendarDue[]> {
  const res = await fetch(`/api/v1/compliance/regcon-calendar?months=${months}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Calendar failed (${res.status})`);
  return res.json();
}

export interface EclRow {
  stage: string; ifrsStage: number; loans: number;
  eadMinor: number; pdBp: number; lgdBp: number;
  eclMinor: number; brpdProvisionMinor: number;
}

export interface EclBoard {
  asOf: string; rows: EclRow[];
  eclMinor: number; brpdProvisionMinor: number; deltaMinor: number;
  runwayMonths: number; mandatoryFrom: string;
}

export async function getEcl(asOf?: string): Promise<EclBoard> {
  const q = asOf ? `?asOf=${encodeURIComponent(asOf)}` : "";
  const res = await fetch(`/api/v1/compliance/ifrs9/ecl${q}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`ECL board failed (${res.status})`);
  return res.json();
}

export interface CarInputs {
  asOf: string;
  rows: { classification: string; outstanding_taka: string; risk_weight_percent: number; rwa_taka: string }[];
  eligible_capital_taka: string;
  rwa_taka: string;
  car_percent: number | null;
  floor_percent: number;
  buffer_pp: number | null;
}

export async function getCar(): Promise<CarInputs> {
  const res = await fetch("/api/v1/compliance/basel/car", { headers: authHeaders() });
  if (!res.ok) throw new Error(`CAR failed (${res.status})`);
  return res.json();
}

export interface PortfolioGroup {
  [key: string]: string | number;   // group key + loans/principalMinor/... columns
  loans: number;
  principalMinor: number;
  outstandingMinor: number;
  provisionMinor: number;
  coveragePercent: number;
}

export interface PortfolioReadModel {
  groupBy: string;
  activeLoans: number;
  rows: PortfolioGroup[];
  totalOutstandingMinor: number;
  totalProvisionMinor: number;
}

export async function getPortfolio(groupby: string): Promise<PortfolioReadModel> {
  const res = await fetch(`/api/v1/reporting/portfolio?groupby=${encodeURIComponent(groupby)}`,
    { headers: authHeaders() });
  if (!res.ok) throw new Error(`Portfolio failed (${res.status})`);
  return res.json();
}

// ── report definitions (12 W11 writer slice) ────────────────────────────

export interface ReportDefinitionView {
  id: string; name: string; domain: string; groupBy: string;
  schedule: string; createdBy: string; createdAt: string;
}

export async function listDefinitions(): Promise<ReportDefinitionView[]> {
  const res = await fetch("/api/v1/reporting/definitions", { headers: authHeaders() });
  if (!res.ok) throw new Error(`Definitions failed (${res.status})`);
  return res.json();
}

export async function saveDefinition(name: string, groupBy: string, schedule?: string):
  Promise<ReportDefinitionView> {
  const res = await fetch("/api/v1/reporting/definitions", {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ name, groupBy, schedule }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail ?? `Save failed (${res.status})`);
  return body;
}

export async function runDefinition(id: string): Promise<PortfolioReadModel & {
  definition: { id: string; name: string; schedule: string; createdBy: string };
}> {
  const res = await fetch(`/api/v1/reporting/definitions/${id}/run`, { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail ?? `Run failed (${res.status})`);
  return body;
}
