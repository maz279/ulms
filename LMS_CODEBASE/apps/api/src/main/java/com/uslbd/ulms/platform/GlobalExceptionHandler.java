package com.uslbd.ulms.platform;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.NoSuchElementException;

/**
 * RFC 9457 mapping per PLANNING/05 §3 (registry: docs/errors.md):
 * 404 unknown entity · 422 validation/policy · 409 state conflict.
 * The web client reads `detail`; `code` gives stable i18n keys.
 */
@RestControllerAdvice
class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    /** Unknown entity (No customer/app/task …) → 404. */
    @ExceptionHandler(NoSuchElementException.class)
    ProblemDetail notFound(NoSuchElementException ex) {
        return withCode(ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage()),
                "ULMS-NOT-FOUND");
    }

    /** Validation + policy arguments (DBR gate, bad enum, unreadable upload) → 422. */
    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail unprocessable(IllegalArgumentException ex) {
        return withCode(ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage()),
                "ULMS-VAL-0001");
    }

    /** State violations (already submitted, draft locked, checksum mismatch) → 409. */
    @ExceptionHandler(IllegalStateException.class)
    ProblemDetail conflict(IllegalStateException ex) {
        return withCode(ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage()),
                "ULMS-STATE-0001");
    }

    /** Role gate denial (ladder level mismatch) → 403, no internal detail. */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    ProblemDetail forbidden(org.springframework.security.access.AccessDeniedException ex) {
        return withCode(ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage()),
                "ULMS-FORBIDDEN");
    }

    /** Stale version on PATCH (05 §4) → 409, reload-and-retry semantics. */
    @ExceptionHandler(VersionConflictException.class)
    ProblemDetail versionConflict(VersionConflictException ex) {
        return withCode(ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage()),
                "ULMS-STATE-0002");
    }

    /** Concurrent modification lost the race (Hibernate optimistic lock). */
    @ExceptionHandler(org.springframework.dao.OptimisticLockingFailureException.class)
    ProblemDetail optimisticLock(org.springframework.dao.OptimisticLockingFailureException ex) {
        return withCode(ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                        "Concurrent modification — reload and retry"),
                "ULMS-STATE-0002");
    }

    private static ProblemDetail withCode(ProblemDetail pd, String code) {
        pd.setProperty("code", code);
        return pd;
    }
}
