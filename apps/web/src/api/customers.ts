export interface CustomerView {
  id: string;
  cifNo: string;
  name: { en: string; bn?: string | null };
  nameEn: string;
  nameBn?: string;
  nidMasked?: string;
  segment: 'RETAIL' | 'SME' | 'CORPORATE' | 'AGRI';
  mobile: string;
  branchCode: string;
  fineractClientId: number | null;
  kycStatus: string;
  createdAt: string;
}

export interface CustomerPage {
  data: CustomerView[];
  meta: { page: number; size: number; totalElements: number };
}

export interface CustomerCreate {
  nameEn: string;
  nameBn?: string;
  segment: CustomerView['segment'];
  mobile: string;
  branchCode: string;
}

export interface Customer360 {
  id: string;
  cifNo: string;
  customer: CustomerView;
  applications: any[];
  kycChecks: any[];
  screeningHits: any[];
}

/**
 * Auth headers. Against the compose stack the browser carries the Keycloak
 * session (or VITE_ULMS_TOKEN in dev); against the local mock API the actor
 * rides on X-ULMS-Actor so audit rows name the dev officer.
 */
export function authHeaders(idempotencyKey?: string): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = import.meta.env.VITE_ULMS_TOKEN as string | undefined;
  if (token) h['Authorization'] = `Bearer ${token}`;
  // live session (oidc) rides along; dev modes identify the persona so the
  // mock API + audit rows name the right officer
  try {
    const raw = localStorage.getItem('ulms-auth');
    if (raw) {
      const s = JSON.parse(raw) as { accessToken?: string; officer?: string; roles?: string[] };
      if (s.accessToken && !token) h['Authorization'] = `Bearer ${s.accessToken}`;
      if (s.officer) h['X-ULMS-Actor'] = s.officer;
      if (s.roles?.length) h['X-ULMS-Roles'] = s.roles.join(',');
    }
  } catch { /* storage blocked — env fallback below */ }
  if (!h['X-ULMS-Actor']) h['X-ULMS-Actor'] = 'r.islam';
  if (idempotencyKey) h['Idempotency-Key'] = idempotencyKey;
  return h;
}

async function jw<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const p = await res.json().catch(() => ({}));
    throw new Error((p as any).detail ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export async function createCustomer(body: CustomerCreate): Promise<CustomerView> {
  return jw(await fetch('/api/v1/customers', {
    method: 'POST',
    headers: authHeaders(crypto.randomUUID()),
    body: JSON.stringify(body),
  }));
}

export async function listCustomers(page = 1, size = 25): Promise<CustomerPage> {
  return jw(await fetch(`/api/v1/customers?page=${page}&size=${size}`, {
    headers: authHeaders(),
  }));
}

export async function kycRefresh(customerId: string, nid: string, dob: string): Promise<CustomerView> {
  return jw(await fetch(`/api/v1/customers/${encodeURIComponent(customerId)}/kyc-refresh`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ nid, dob }),
  }));
}

export async function screenCustomer(customerId: string): Promise<any> {
  return jw(await fetch(`/api/v1/customers/${encodeURIComponent(customerId)}/screen`, {
    method: 'POST',
    headers: authHeaders(),
  }));
}

export async function getCustomer360(cifOrId: string): Promise<Customer360> {
  return jw(await fetch(`/api/v1/customers/${encodeURIComponent(cifOrId)}`, {
    headers: authHeaders(),
  }));
}
