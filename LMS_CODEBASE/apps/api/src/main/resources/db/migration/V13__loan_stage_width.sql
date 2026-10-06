-- R4 write-off execution: Loan.writeOffToZero() sets stage='WRITTEN_OFF'
-- (11 chars) which overflows V5's VARCHAR(10) — widen to fit + headroom.
ALTER TABLE ulms.loan ALTER COLUMN stage TYPE VARCHAR(16);
