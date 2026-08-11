package com.commercehub.identity.listener;

import com.commercehub.identity.event.PasswordResetRequestedEvent;
import com.commercehub.identity.event.UserRegisteredEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class MailEventListener {

    private static final Logger log = LoggerFactory.getLogger(MailEventListener.class);

    private final JavaMailSender mailSender;
    private final String frontendUrl;

    public MailEventListener(JavaMailSender mailSender,
                             @Value("${app.frontend-url}") String frontendUrl) {
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl;
    }

    @Async
    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(event.email());
            helper.setSubject("Welcome to CommerceHub!");
            helper.setText(
                    "<p>Hi " + event.firstName() + ",</p>" +
                    "<p>Welcome to CommerceHub! Your account has been created successfully.</p>" +
                    "<p><a href=\"" + frontendUrl + "/login\">Sign in now</a></p>",
                    true);
            mailSender.send(message);
            log.info("Welcome email sent to userId={}", event.userId());
        } catch (MessagingException e) {
            log.error("Failed to send welcome email to userId={}: {}", event.userId(), e.getMessage());
        }
    }

    @Async
    @EventListener
    public void onPasswordResetRequested(PasswordResetRequestedEvent event) {
        String resetLink = frontendUrl + "/reset-password?token=" + event.rawToken();
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(event.email());
            helper.setSubject("Reset your CommerceHub password");
            helper.setText(
                    "<p>You requested a password reset. Click the link below to set a new password.</p>" +
                    "<p><a href=\"" + resetLink + "\">Reset Password</a></p>" +
                    "<p>This link expires in 1 hour. If you did not request this, ignore this email.</p>",
                    true);
            mailSender.send(message);
            log.info("Password reset email sent to userId={}", event.userId());
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to userId={}: {}", event.userId(), e.getMessage());
        }
    }
}
