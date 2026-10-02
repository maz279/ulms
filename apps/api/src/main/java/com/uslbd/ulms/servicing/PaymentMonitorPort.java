package com.uslbd.ulms.servicing;

/**
 * Payment-stream observation port (R10 P-C): servicing OWNS the payment
 * lifecycle and calls this after every posting; the AML monitoring module
 * implements it (CTR/velocity/structuring). The port keeps the module graph
 * acyclic — same pattern as ComplianceAlertPort.
 */
public interface PaymentMonitorPort {
    void observe(Payment payment);
}
