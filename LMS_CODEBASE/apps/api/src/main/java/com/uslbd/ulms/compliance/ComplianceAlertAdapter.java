package com.uslbd.ulms.compliance;

import com.uslbd.ulms.servicing.ComplianceAlertPort;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Adapter backing the servicing-side alert port — writes compliance_alert
 * rows via the repository only (no servicing imports, keeping the module
 * graph acyclic: compliance→servicing for loans is the single direction).
 */
@Component
public class ComplianceAlertAdapter implements ComplianceAlertPort {

    private final ComplianceAlertRepository alerts;

    ComplianceAlertAdapter(ComplianceAlertRepository alerts) { this.alerts = alerts; }

    @Override
    public void raiseAlert(String type, String aggregate, UUID aggregateId, String detailJson) {
        alerts.save(ComplianceAlert.open(UUID.randomUUID(), type, aggregate, aggregateId,
                detailJson));
    }
}
