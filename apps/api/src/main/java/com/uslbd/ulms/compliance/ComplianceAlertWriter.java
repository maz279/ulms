package com.uslbd.ulms.compliance;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Writes a compliance alert in its OWN transaction (REQUIRES_NEW) so it
 * survives when the calling business transaction rolls back — e.g. the
 * provision-JV drift alert must persist even though the blocked repost
 * throws.
 */
@Component
class ComplianceAlertWriter {

    private final ComplianceAlertRepository alerts;

    ComplianceAlertWriter(ComplianceAlertRepository alerts) { this.alerts = alerts; }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    ComplianceAlert raise(String type, String aggregate, UUID aggregateId, String detailJson) {
        return alerts.save(ComplianceAlert.open(UUID.randomUUID(), type, aggregate, aggregateId, detailJson));
    }
}
