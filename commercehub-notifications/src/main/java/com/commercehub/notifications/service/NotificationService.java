package com.commercehub.notifications.service;

import com.commercehub.notifications.dto.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface NotificationService {

    Page<NotificationResponse> getNotifications(UUID userId, Pageable pageable);

    long getUnreadCount(UUID userId);

    void markAllRead(UUID userId);

    NotificationResponse send(UUID userId, String type, String title, String message);
}
