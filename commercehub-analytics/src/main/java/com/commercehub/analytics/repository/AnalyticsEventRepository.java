package com.commercehub.analytics.repository;

import com.commercehub.analytics.entity.AnalyticsEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, UUID> {

    Page<AnalyticsEvent> findAllByEventType(String eventType, Pageable pageable);

    Page<AnalyticsEvent> findAllByUserId(UUID userId, Pageable pageable);

    Page<AnalyticsEvent> findAllByCreatedAtBetween(Instant from, Instant to, Pageable pageable);
}
