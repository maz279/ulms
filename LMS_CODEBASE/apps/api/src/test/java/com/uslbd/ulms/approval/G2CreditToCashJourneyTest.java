package com.uslbd.ulms.approval;

import com.uslbd.ulms.compliance.EodBatchService;
import com.uslbd.ulms.integration.docs.DocumentStorePort;
import com.uslbd.ulms.integration.fineract.FineractLoanPort;
import com.uslbd.ulms.integration.fineract.FineractPort;
import com.uslbd.ulms.origination.Application;
import com.uslbd.ulms.origination.OriginationService;
import com.uslbd.ulms.platform.workflow.WorkflowService;
import com.uslbd.ulms.servicing.LoanRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * G2 gate slice: submit → CIB pull → scoring → CPV → ladder → SANCTION →
 * disbursement dual-auth (invariant!) → Fineract disburse → DISBURSED + loan
 * mirror → EOD run classifies the new loan (STD-0). Fineract stubbed at the
 * port (disburse returns a fixed txn id); Postgres real.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
@ActiveProfiles("test")
class G2CreditToCashJourneyTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @TestConfiguration
    static class Ports {
        @Bean @Primary FineractPort clientPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return client -> 5000 + seq.incrementAndGet();
        }
        @Bean @Primary FineractLoanPort loanPort() {
            var seq = new java.util.concurrent.atomic.AtomicLong();
            return new FineractLoanPort() {
                @Override public long createLoan(LoanSpec spec) { return 5500 + seq.incrementAndGet(); }
                @Override public long disburseLoan(long loanId, long amountMinor) {
                    assertThat(amountMinor).isPositive();
                    return 99000 + seq.incrementAndGet();   // distinct txn ids
                }
            };
        }
        @Bean @Primary DocumentStorePort docPort() {
            return new DocumentStorePort() {
                @Override public StoredObject put(String key, java.io.InputStream bytes,
                                                  long size, String contentType) {
                    return new StoredObject(key, "0".repeat(64), size);
                }
                @Override public String presignedGetUrl(String key, DurationTtl ttl) {
                    return "http://minio.local/" + key;
                }
            };
        }
    }

    @Autowired OriginationService origination;
    @Autowired ApprovalService approvals;
    @Autowired DisbursementService disbursements;
    @Autowired EodBatchService eod;
    @Autowired LoanRepository loans;
    @Autowired WorkflowService workflow;
    @Autowired com.uslbd.ulms.customer.CustomerService customers;

    private static final SecureRandom RANDOM = new SecureRandom();

    private Application toSanction() {
        var req = new com.uslbd.ulms.customer.CustomerCreateRequest(
                "G2 Person", null, com.uslbd.ulms.customer.Customer.Segment.SME,
                "+8801712345678", null, "BR-001");
        var customer = customers.create(req, UUID.randomUUID(), "user:test", UUID.randomUUID());
        var a = origination.createDraft("APP-G2" + RANDOM.nextInt(99_999),
                customer.getId(), "sme-term", 150_000_000L, 24,   // ৳15L
                Application.RateType.FIXED, "BR-001", 1_000_000_00L, 0L, "user:officer");
        origination.submit(a.getId(), "user:officer");            // → CPV
        origination.cpv(a.getId(), true, "verified", "user:cpv"); // → APPROVAL (L3: ৳15L)
        var task = workflow.currentTask("application", a.getId()).orElseThrow();
        UUID current = task.getId();
        for (String officer : new String[]{"user:l3", "user:l4", "user:l5", "user:l6", "user:l7"}) {
            var out = approvals.act(current, WorkflowService.Action.APPROVE, officer, "ok");
            if (out.nextTaskId() == null) break;
            current = out.nextTaskId();
        }
        assertThat(origination.get(a.getId()).getStage()).isEqualTo(Application.Stage.SANCTION);
        return origination.get(a.getId());
    }

    @Test
    void creditToCashJourney() {
        Application sanctioned = toSanction();

        // ── dual-auth chain
        var prepared = disbursements.prepare(sanctioned.getId(), "user:maker");
        assertThat(prepared.getState()).isEqualTo("PREPARED");

        // THE invariant: preparer cannot authorize (03: enforced in service)
        assertThatThrownBy(() -> disbursements.authorize(prepared.getId(), "user:maker"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Dual-authorization violation");

        var authorized = disbursements.authorize(prepared.getId(), "user:checker");
        assertThat(authorized.getState()).isEqualTo("AUTHORIZED");

        // release needs a THIRD pair of hands (checker never executes)
        assertThatThrownBy(() -> disbursements.release(authorized.getId(), "user:checker"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("different officer");
        assertThatThrownBy(() -> disbursements.release(authorized.getId(), "user:maker"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("different officer");

        var released = disbursements.release(authorized.getId(), "user:releaser");
        assertThat(released.getState()).isEqualTo("RELEASED");
        assertThat(released.getFineractTxnId()).isPositive();

        // application DISBURSED + loan mirror created (STD-0, DPD 0)
        assertThat(origination.get(sanctioned.getId()).getStage())
                .isEqualTo(Application.Stage.DISBURSED);
        var loan = loans.findByApplicationId(sanctioned.getId()).orElseThrow();
        assertThat(loan.getPrincipalMinor()).isEqualTo(150_000_000L);
        assertThat(loan.getClassification()).isEqualTo("STD-0");

        // ── EOD run classifies the fresh loan
        var run = eod.run(LocalDate.now(), "user:compliance");
        assertThat(run.loansClassified()).isGreaterThanOrEqualTo(1);
        assertThat(run.provisionsByClass()).containsKey("STD-0");

        // rerun for the same date is idempotent (no duplicate history)
        var rerun = eod.run(LocalDate.now(), "user:compliance");
        assertThat(rerun.loansClassified()).isEqualTo(run.loansClassified());
        assertThat(rerun.totalProvisionMinor()).isEqualTo(run.totalProvisionMinor());

        // full actor trail on the disbursement
        var trail = disbursements.trail(released.getId());
        assertThat(trail).extracting("action").containsExactly("PREPARE", "AUTHORIZE", "RELEASE");
    }

    @Test
    void strAlertRaisedAtCashThreshold() {
        Application sanctioned = toSanction();   // ৳15L ≥ ৳10L threshold
        final var prepared = disbursements.prepare(sanctioned.getId(), "user:m2");
        final var authorized = disbursements.authorize(prepared.getId(), "user:c2");
        disbursements.release(authorized.getId(), "user:r2");
        assertThat(eod.openAlerts())
                .filteredOn(a -> "STR_CASH_THRESHOLD".equals(a.getType()))
                .isNotEmpty();                    // BFIU hook fired (06 §4)
    }
}
