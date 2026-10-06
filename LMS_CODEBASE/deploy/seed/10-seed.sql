-- Synthetic seed (dev only — PLANNING/09 §4: the prototype demo dataset is
-- the shared fixture so dev/CI/UAT all see the same world).
INSERT INTO ulms.customer (id, cif_no, name_en, name_bn, segment, mobile, branch_code, kyc_status)
VALUES
  (gen_random_uuid(), 'CIF-100871', 'Md. Rafiqul Islam', 'মোঃ রফিকুল ইসলাম', 'SME',      '+8801712345678', 'BR-001', 'VERIFIED'),
  (gen_random_uuid(), 'CIF-100872', 'Nusrat Jahan',     'নুসরাত জাহান',     'RETAIL',   '+8801812345678', 'BR-001', 'VERIFIED'),
  (gen_random_uuid(), 'CIF-100873', 'Salma Khatun',     'সালমা খাতুন',      'RETAIL',   '+8801912345678', 'BR-004', 'PENDING'),
  (gen_random_uuid(), 'CIF-100874', 'Habibur Rahman',   'হাবিবুর রহমান',    'AGRI',     '+8801612345678', 'BR-009', 'PENDING'),
  (gen_random_uuid(), 'CIF-100875', 'S. M. Tanvir Ahmed','এস এম তানভীর আহমেদ','CORPORATE','+8801512345678', 'BR-003', 'VERIFIED')
ON CONFLICT (cif_no) DO NOTHING;

-- ── P2 migrated demo portfolio (G2: BRPD board live against demo data) ──
-- One loan per BRPD 15/2024 class, DPD hand-set to exercise every band.
-- application_id NULL — migrated portfolio rows map to the customer directly.
INSERT INTO ulms.loan (id, application_id, customer_id, loan_no, principal_minor,
                        outstanding_minor, dpd, stage, classification, interest_suspense)
SELECT gen_random_uuid(), NULL, c.id, v.loan_no, v.outstanding, v.outstanding,
       v.dpd, 'ACTIVE', 'STD-0', false
FROM (VALUES
  ('LN-300001', 'CIF-100871',  4000000000,   0),   -- STD-0  current
  ('LN-300002', 'CIF-100872',  2500000000,  22),   -- STD-1  watch
  ('LN-300003', 'CIF-100873',  1800000000,  47),   -- STD-2  caution
  ('LN-300004', 'CIF-100874',  3200000000,  78),   -- SMA
  ('LN-300005', 'CIF-100875',  8500000000, 140),   -- SS (interest suspense)
  ('LN-300006', 'CIF-100871',  6000000000, 240),   -- DF
  ('LN-300007', 'CIF-100872',  5000000000, 410)    -- B/L
) AS v(loan_no, cif_no, outstanding, dpd)
JOIN ulms.customer c ON c.cif_no = v.cif_no
WHERE NOT EXISTS (SELECT 1 FROM ulms.loan l WHERE l.loan_no = v.loan_no);
