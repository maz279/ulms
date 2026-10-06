package com.uslbd.ulms.servicing;

import java.util.UUID;

/**
 * Alert-raising port for the servicing module (P3): recon mismatches and
 * other payment-side events become compliance_alert rows. Declared HERE so
 * the module graph stays one-way: compliance → servicing (loans) is the only
 * allowed direction; servicing reaches compliance only through this port.
 */
public interface ComplianceAlertPort {
    void raiseAlert(String type, String aggregate, UUID aggregateId, String detailJson);
}
