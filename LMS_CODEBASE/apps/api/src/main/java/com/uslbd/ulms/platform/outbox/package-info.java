/**
 * Named interface exposing the transactional outbox API (ADR-004) to other
 * modules — emit at state-change sites, Consumer for relay subscribers
 * (Modulith: sub-packages are internal unless exposed).
 */
@org.springframework.modulith.NamedInterface("outbox")
package com.uslbd.ulms.platform.outbox;
