package com.uslbd.ulms.origination;

/**
 * CIB pull failed at submit (11 §1). Typed so submit can declare
 * noRollbackFor: the FAILED report row, RB-05 alert and audits COMMIT while
 * the caller still receives a 409 problem detail.
 */
public class CibPullFailedException extends RuntimeException {
    public CibPullFailedException(String message) { super(message); }
}
