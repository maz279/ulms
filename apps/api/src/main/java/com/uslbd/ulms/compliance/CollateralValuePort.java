package com.uslbd.ulms.compliance;

/**
 * Collateral realizable-value port (R10 P-F): compliance (Basel CRM) reads
 * the recognized realizable collateral through this port; the assessment
 * module's registry implements it. Keeps the module graph acyclic —
 * assessment→compliance is the allowed single direction.
 */
public interface CollateralValuePort {
    long realizableOf(java.util.UUID customerId);
}
