package com.uslbd.ulms.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Mirrors packages/openapi CustomerCreate — Zod↔DTO parity tested in e2e. */
public record CustomerCreateRequest(
        @NotBlank @Size(max = 140) String nameEn,
        @Size(max = 140) String nameBn,
        Customer.Segment segment,        // validated enum — rejects unknown segment (422)
        @Pattern(regexp = "^\\+8801[3-9]\\d{8}$", message = "BD mobile required (+8801XXXXXXXXX)")
        String mobile,
        @Size(max = 24) String nid,      // masked on persist (06 §5)
        @NotBlank @Size(max = 8) String branchCode
) {}
