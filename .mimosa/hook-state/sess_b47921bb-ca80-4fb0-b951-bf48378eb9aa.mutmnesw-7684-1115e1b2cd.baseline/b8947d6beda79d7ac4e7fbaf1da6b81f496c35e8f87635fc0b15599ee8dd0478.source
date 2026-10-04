/* ============================================================
   ULMS Borrower app — API client. Speaks the SAME /portal/v1
   contract as the borrower web portal (PLANNING/08 Part B):
   OTP login, own-CIF loans/tracker/payments/apply/statement.
   Base URL is env-configured (ENV ONLY — no literals):
     EXPO_PUBLIC_API_BASE  e.g. https://portal.ulms.bank.local
   Dev default points at the local mock for the demo stack.
   Security: buildUrl() assembles every request from a VALIDATED
   base (http(s) only; plain http only for the local demo stack),
   fixed route constants, and per-key encodeURIComponent — callers
   can never steer protocol, host, or path. The rail redirect URL
   returned by the server passes an https-only check before
   Linking opens it.
   ============================================================ */
import AsyncStorage from "@react-native-async-storage/async-storage";

const RAW_BASE = (process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:8081").replace(/\/$/, "");
const ALLOW_LOCALHOST = RAW_BASE.startsWith("http://localhost") || RAW_BASE.startsWith("http://127.");
const SESSION_KEY = "ulms.borrower.session";
const ABS_URL = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]+)/i;

/** Validate the pinned API base once: http(s) only — plain http is permitted
 *  ONLY for the local demo stack (localhost/127.); bank environments must be
 *  https. Host must carry no userinfo. */
function assertValidBase(base: string): string {
  const m = base.match(ABS_URL);
  if (!m) throw new Error("EXPO_PUBLIC_API_BASE must be an absolute http(s) URL");
  const proto = m[1].toLowerCase();
  const host = m[2];
  if (proto !== "https" && !(proto === "http" && ALLOW_LOCALHOST)) {
    throw new Error("API base must be https (http allowed only for the local demo stack)");
  }
  if (host.includes("@")) throw new Error("API base must not carry credentials");
  return base;
}

const BASE = assertValidBase(RAW_BASE);

/** Single URL factory: fixed path constants + fully-encoded query values. */
function buildUrl(path: string, query?: Record<string, string>): string {
  if (!query) return BASE + path;
  const pairs = Object.keys(query).map((k) => k + "=" + encodeURIComponent(query[k]));
  return pairs.length === 0 ? BASE + path : BASE + path + "?" + pairs.join("&");
}

/** Same protocol policy for server-provided redirect URLs (rail checkout). */
export function assertSafeExternalUrl(url: string): string {
  if (!/^https:\/\//i.test(url)) {
    throw new Error("rail checkout URL must be https");
  }
  return url;
}

export interface Me {
  cifNo: string; nameEn: string; nameBn?: string | null;
  loans: LoanCard[];
}
export interface LoanCard {
  loanId: string; loanNo: string; productCode: string;
  outstandingMinor: number; emiMinor: number; nextDueOn: string | null;
  dpd: number; classification: string;
}
export interface TrackerRow {
  appNo: string; stage: string; productCode: string;
  amountMinor: number; submittedAt: string;
}
export interface PaymentLine {
  paidAt: string; amountMinor: number; rail: string; utr: string | null;
}
export interface PaymentIntent {
  intentId: string; railUrl: string | null; status: string;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

async function jw<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const p = await res.json().catch(() => ({} as { detail?: string }));
    throw new Error(p.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

/** Step 1 of login: request an SMS OTP for the mobile number. */
export async function requestOtp(mobile: string): Promise<string | null> {
  const res = await fetch(buildUrl("/api/v1/portal/otp"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ mobile, purpose: "login" }),
  });
  const data = await jw<{ devCode?: string }>(res);
  return data.devCode ?? null;   // production delivers by SMS; dev returns it
}

/** Step 2: verify the code — the otpToken authorizes payment confirmations. */
export async function verifyOtp(mobile: string, code: string): Promise<string> {
  const res = await fetch(buildUrl("/api/v1/portal/otp/verify"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ mobile, code }),
  });
  const data = await jw<{ otpToken?: string }>(res);
  return data.otpToken ?? "";
}

export async function fetchMe(mobile: string): Promise<Me> {
  return jw(await fetch(buildUrl("/api/v1/portal/me", { mobile })));
}

export async function fetchTracker(cif: string): Promise<TrackerRow[]> {
  const res = await fetch(buildUrl("/api/v1/portal/me/application", { cif }));
  if (!res.ok) return [];
  return (await res.json()).data ?? [];
}

export async function fetchPayments(mobile: string, loanId: string): Promise<PaymentLine[]> {
  const res = await fetch(buildUrl("/api/v1/portal/me/payments", { loanId, mobile }));
  if (!res.ok) return [];
  return (await res.json()).data ?? [];
}

export async function applyLoan(mobile: string, productCode: string,
                                amountMinor: number, tenorMonths: number): Promise<{ appNo: string }> {
  return jw(await fetch(buildUrl("/api/v1/portal/me/applications"), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ mobile, productCode, amountMinor, tenorMonths }),
  }));
}

/** OTP-confirmed payment initiation — the rail URL opens bKash/Nagad
 *  (redirect model; the app NEVER handles card/wallet credentials). */
export async function initiatePayment(loanId: string, amountMinor: number,
                                      rail: string, otpToken: string | null,
                                      mobile: string): Promise<PaymentIntent> {
  const query = otpToken ? { otpToken, mobile } : undefined;
  return jw(await fetch(buildUrl("/api/v1/portal/me/payments/initiate", query), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ loanId, amountMinor, rail }),
  }));
}

export function statementUrl(loanId: string, mobile: string): string {
  return buildUrl("/api/v1/portal/me/loans/" + encodeURIComponent(loanId) + "/statement.csv",
    { mobile });
}

/* ---------- lightweight session (mobile + otpToken) ---------- */

export interface BorrowerSession { mobile: string; otpToken: string | null; me: Me }

export async function saveSession(s: BorrowerSession | null): Promise<void> {
  if (!s) { await AsyncStorage.removeItem(SESSION_KEY); return; }
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
}
export async function loadSession(): Promise<BorrowerSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as BorrowerSession) : null;
}
