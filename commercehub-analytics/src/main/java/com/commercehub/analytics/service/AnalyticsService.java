package com.commercehub.analytics.service;

import com.commercehub.analytics.dto.AnalyticsEventResponse;
import com.commercehub.analytics.dto.TrackEventRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.UUID;

public interface AnalyticsService {

    void track(UUID userId, TrackEventRequest request);

    Page<AnalyticsEventResponse> queryEvents(String eventType, Instant from, Instant to, Pageable pageable);
}
