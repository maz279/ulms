package com.uslbd.ulms.customer;

import java.util.List;
import java.util.UUID;

/** API view — bilingual names exposed as {en,bn}; client renders ONE (05 §6). */
record CustomerView(UUID id, String cifNo, BilingualName name, String segment,
                    String mobile, String branchCode, Long fineractClientId,
                    String kycStatus, java.time.Instant createdAt) {

    record BilingualName(String en, String bn) {}

    static CustomerView of(Customer c) {
        return new CustomerView(c.getId(), c.getCifNo(),
                new BilingualName(c.getNameEn(), c.getNameBn()),
                c.getSegment(), c.getMobile(), c.getBranchCode(),
                c.getFineractClientId(), c.getKycStatus(), c.getCreatedAt());
    }
}

record CustomerPageView(List<CustomerView> data, Meta meta) {
    record Meta(int page, int size, long totalElements) {}
    static CustomerPageView of(Iterable<Customer> all, int page, int size) {
        var list = new java.util.ArrayList<CustomerView>();
        all.forEach(c -> list.add(CustomerView.of(c)));
        int from = (page - 1) * size;
        int to = Math.min(from + size, list.size());
        List<CustomerView> slice = from >= list.size() ? List.of() : list.subList(from, to);
        return new CustomerPageView(slice, new Meta(page, size, list.size()));
    }
}
