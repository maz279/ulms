package com.uslbd.ulms.assessment;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Read-side facts assessment needs about an application (03 mod-assessment).
 * Defined HERE and implemented by mod-origination — hexagonal dependency
 * inversion keeps the module graph acyclic (origination → assessment only).
 */
public interface ApplicationFactsProvider {

    record ApplicationFacts(UUID applicationId, UUID customerId, long amountMinor,
                            int tenorMonths, String rateType, Long incomeMinor,
                            Long existingEmiMinor, long collateralValueMinor,
                            BigDecimal computedDbr) {}

    ApplicationFacts facts(UUID applicationId);
}
