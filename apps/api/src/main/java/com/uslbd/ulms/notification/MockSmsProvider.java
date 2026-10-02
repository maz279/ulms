package com.uslbd.ulms.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Dev/test SMS provider (R10 P-A): logs the message instead of sending —
 * the delivery is still recorded, so journeys and audits stay complete
 * without an external gateway. Mutual exclusion with the live gateway
 * mirrors the other R7 adapter pairs.
 */
@Component
@org.springframework.context.annotation.Profile("!sms-live")
public class MockSmsProvider implements SmsProvider {

    private static final Logger log = LoggerFactory.getLogger(MockSmsProvider.class);

    @Override
    public String id() { return "mock"; }

    @Override
    public void send(String to, String body) {
        log.info("[mock-sms] to={} body={}", to, body);
    }
}
