package com.commercehub.analytics.service;

import com.commercehub.analytics.dto.AnalyticsEventResponse;
import com.commercehub.analytics.dto.TrackEventRequest;
import com.commercehub.analytics.entity.AnalyticsEvent;
import com.commercehub.analytics.repository.AnalyticsEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsServiceImpl.class);

    private final AnalyticsEventRepository repository;

    public AnalyticsServiceImpl(AnalyticsEventRepository repository) {
        this.repository = repository;
    }

    @Override
    @Async
    @Transactional
    public void track(UUID userId, TrackEventRequest request) {
        AnalyticsEvent event = new AnalyticsEvent();
        event.setEventType(request.eventType());
        event.setUserId(userId);
        event.setEntityId(request.entityId());
        event.setEntityType(request.entityType());
        event.setMetadata(request.metadata());
        repository.save(event);
        log.debug("Tracked event: type={}, userId={}", request.eventType(), userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AnalyticsEventResponse> queryEvents(String eventType, Instant from, Instant to, Pageable pageable) {
        Page<AnalyticsEvent> events;
        if (eventType != null) {
            events = repository.findAllByEventType(eventType, pageable);
        } else if (from != null && to != null) {
            events = repository.findAllByCreatedAtBetween(from, to, pageable);
        } else {
            events = repository.findAll(pageable);
        }
        return events.map(e -> new AnalyticsEventResponse(
                e.getId(), e.getEventType(), e.getUserId(),
                e.getEntityId(), e.getEntityType(), e.getMetadata(), e.getCreatedAt()));
    }
}
