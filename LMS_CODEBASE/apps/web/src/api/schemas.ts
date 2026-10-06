import { z } from "zod";

/**
 * Zod schemas (PLANNING/07 §4) — client-side validation parity with the
 * backend DTOs (CustomerCreateRequest / ApplicationDraftRequest). The wizard
 * gates steps on these; the server remains the authority (05 §3).
 */

export const bdMobile = z.string().regex(/^\+8801[3-9]\d{8}$/, "BD mobile required (+8801XXXXXXXXX)");

export const customerCreate = z.object({
  nameEn: z.string().min(2, "Name (EN) is required").max(140),
  nameBn: z.string().max(140).optional(),
  segment: z.enum(["RETAIL", "SME", "CORPORATE", "AGRI"]),
  mobile: bdMobile,
  nid: z.string().regex(/^\d{10}$|^\d{13}$|^\d{17}$/, "NID must be 10/13/17 digits").optional(),
  branchCode: z.string().min(2).max(8),
});

export const PRODUCT_CODES = ["sme-term", "retail-personal", "krishi", "islamic-murabaha"] as const;

/** Wizard product step: ৳50K–৳10Cr, 3–120 months (BRD product bounds). */
export const loanProductStep = z.object({
  productCode: z.enum(PRODUCT_CODES),
  amountLakh: z.number().min(0.5, "Minimum ৳0.5 Lakh").max(1000, "Maximum ৳10 Crore"),
  tenor: z.number().int().min(3, "Minimum 3 months").max(120, "Maximum 120 months"),
  rateType: z.enum(["FIXED", "FLOATING"]),
});

/** Finance step: income drives the DBR oracle — must be positive. */
export const financeStep = z.object({
  income: z.number().positive("Monthly income must be > 0"),
  existingEmis: z.number().min(0),
});

export type CustomerCreateInput = z.infer<typeof customerCreate>;
export type LoanProductStep = z.infer<typeof loanProductStep>;
export type FinanceStep = z.infer<typeof financeStep>;
