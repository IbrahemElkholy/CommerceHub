package com.commercehub.notifications.controller;

import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import com.commercehub.identity.entity.User;
import com.commercehub.notifications.dto.NotificationResponse;
import com.commercehub.notifications.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@PreAuthorize("isAuthenticated()")
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Get notifications")
    public ApiResponse<PagedResponse<NotificationResponse>> list(@AuthenticationPrincipal User principal,
                                                                  @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(notificationService.getNotifications(principal.getId(), pageable)));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get unread notification count")
    public ApiResponse<Long> unreadCount(@AuthenticationPrincipal User principal) {
        return ApiResponse.ok(notificationService.getUnreadCount(principal.getId()));
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ApiResponse<Void> markAllRead(@AuthenticationPrincipal User principal) {
        notificationService.markAllRead(principal.getId());
        return ApiResponse.ok();
    }
}
