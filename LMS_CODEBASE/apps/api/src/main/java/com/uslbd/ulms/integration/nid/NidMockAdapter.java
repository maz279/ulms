package com.uslbd.ulms.integration.nid;

import org.springframework.stereotype.Component;

/**
 * P1 MOCK adapter (PLANNING/12 W4-L): deterministic, no network. Rules —
 * 13-digit NID + non-blank name + DOB present → VERIFIED with a stable
 * reference id (audit-joinable); malformed NID → REJECTED. The UAT adapter
 * for the real NIDW gateway replaces this bean behind the same port.
 */
@Component
// mutual exclusion with the live adapter (nid-live flag, R7)
@org.springframework.context.annotation.Profile("!nid-live")
public class NidMockAdapter implements NidPort {

    @Override
    public NidResult verify(NidQuery query) {
        if (query.nid() == null || !query.nid().matches("\\d{10}|\\d{13}|\\d{17}")) {
            return new NidResult(NidResult.REJECTED,
                    "MOCK-" + Integer.toHexString(query.hashCode()), null);
        }
        if (query.nameEn() == null || query.nameEn().isBlank() || query.dob() == null) {
            return new NidResult(NidResult.REJECTED,
                    "MOCK-" + Integer.toHexString(query.hashCode()), null);
        }
        return new NidResult(NidResult.VERIFIED,
                "NIDW-MOCK-" + query.nid().substring(query.nid().length() - 6),
                query.nameEn().toUpperCase());
    }
}
