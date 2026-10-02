package com.uslbd.ulms.product;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanProductRepository extends JpaRepository<LoanProduct, UUID> {
    Optional<LoanProduct> findByCodeAndStatus(String code, LoanProduct.Status status);
    List<LoanProduct> findByStatusOrderByCodeAsc(LoanProduct.Status status);
    List<LoanProduct> findByCodeOrderByVersionDesc(String code);
}
