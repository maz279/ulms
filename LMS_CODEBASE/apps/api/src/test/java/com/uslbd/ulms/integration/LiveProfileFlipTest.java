package com.uslbd.ulms.integration;

import com.uslbd.ulms.integration.cib.CibOnlineAdapter;
import com.uslbd.ulms.integration.cib.CibPort;
import com.uslbd.ulms.integration.docs.ClamAvScanAdapter;
import com.uslbd.ulms.integration.docs.ScanPort;
import com.uslbd.ulms.integration.nid.NidPort;
import com.uslbd.ulms.integration.nid.NidwAdapter;
import com.uslbd.ulms.integration.rails.BkashRailAdapter;
import com.uslbd.ulms.integration.rails.PaymentRailPort;
import com.uslbd.ulms.integration.screening.ScreeningListAdapter;
import com.uslbd.ulms.integration.screening.ScreeningPort;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * R7 feature-flag flips (audit round 2): activating every live profile at
 * once must swap each port to its live adapter and leave exactly ONE bean
 * per port — the mock adapters carry @Profile("!<live>") guards because a
 * mock/live pair used to register two beans of the same port and break
 * context startup, which no test covered before this one. Live endpoints
 * resolve to inert test stubs via application-test.yml.
 */
@SpringBootTest
@ActiveProfiles({"test", "cib-live", "nid-live", "screening-live",
        "rails-live", "sms-live", "cbs-live", "av-live"})
@Testcontainers(disabledWithoutDocker = true)
class LiveProfileFlipTest {

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired ApplicationContext ctx;
    @Autowired CibPort cib;
    @Autowired NidPort nid;
    @Autowired ScreeningPort screening;
    @Autowired PaymentRailPort rails;
    @Autowired ScanPort scan;

    @Test
    void everyLiveFlagSwapsThePortAndNoMockRemains() {
        assertThat(cib).isInstanceOf(CibOnlineAdapter.class);
        assertThat(nid).isInstanceOf(NidwAdapter.class);
        assertThat(screening).isInstanceOf(ScreeningListAdapter.class);
        assertThat(rails).isInstanceOf(BkashRailAdapter.class);
        assertThat(scan).isInstanceOf(ClamAvScanAdapter.class);

        // one bean per port — the pre-fix mock/live duplicate would fail here;
        // a count of 1 also proves each mock twin is excluded (it implements
        // the same port interface)
        assertThat(ctx.getBeansOfType(CibPort.class)).hasSize(1);
        assertThat(ctx.getBeansOfType(NidPort.class)).hasSize(1);
        assertThat(ctx.getBeansOfType(ScreeningPort.class)).hasSize(1);
        assertThat(ctx.getBeansOfType(PaymentRailPort.class)).hasSize(1);
        assertThat(ctx.getBeansOfType(ScanPort.class)).hasSize(1);
    }
}
