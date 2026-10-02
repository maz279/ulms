package com.uslbd.ulms.platform.idempotency;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKey, UUID> {}
