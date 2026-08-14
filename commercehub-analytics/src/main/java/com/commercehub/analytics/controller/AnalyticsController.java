package com.commercehub.analytics.controller;

import com.commercehub.analytics.dto.AnalyticsEventResponse;
import com.commercehub.analytics.dto.TrackEventRequest;
import com.commercehub.analytics.service.AnalyticsService;
import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import com.commercehub.identity.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @PostMapping("/events")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Track an analytics event")
    public ApiResponse<Void> track(@AuthenticationPrincipal User principal,
                                    @Valid @RequestBody TrackEventRequest request) {
        analyticsService.track(principal != null ? principal.getId() : null, request);
        return ApiResponse.ok();
    }

    @GetMapping("/events")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Query analytics events")
    public ApiResponse<PagedResponse<AnalyticsEventResponse>> query(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @PageableDefault(size = 50) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(analyticsService.queryEvents(eventType, from, to, pageable)));
    }
}
