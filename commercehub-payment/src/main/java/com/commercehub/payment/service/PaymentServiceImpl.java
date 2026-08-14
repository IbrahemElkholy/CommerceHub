package com.commercehub.payment.service;

import com.commercehub.common.exception.ConflictException;
import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.payment.dto.InitiatePaymentRequest;
import com.commercehub.payment.dto.PaymentResponse;
import com.commercehub.payment.entity.Payment;
import com.commercehub.payment.entity.PaymentStatus;
import com.commercehub.payment.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

    private final PaymentRepository paymentRepository;

    public PaymentServiceImpl(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional
    public PaymentResponse initiatePayment(InitiatePaymentRequest request) {
        paymentRepository.findByIdempotencyKey(request.idempotencyKey())
                .ifPresent(p -> {
                    throw new ConflictException("Payment already initiated with this key");
                });
        Payment payment = new Payment();
        payment.setOrderId(request.orderId());
        payment.setAmount(request.amount());
        payment.setCurrency(request.currency());
        payment.setMethod(request.method());
        payment.setIdempotencyKey(request.idempotencyKey());
        Payment saved = paymentRepository.save(payment);
        log.info("Payment initiated: id={}, orderId={}", saved.getId(), saved.getOrderId());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPayment(UUID paymentId) {
        return toResponse(findOrThrow(paymentId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getPaymentsForOrder(UUID orderId, Pageable pageable) {
        return paymentRepository.findAllByOrderId(orderId, pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    public PaymentResponse refundPayment(UUID paymentId) {
        Payment payment = findOrThrow(paymentId);
        if (payment.getStatus() != PaymentStatus.COMPLETED) {
            throw new ConflictException("Only completed payments can be refunded");
        }
        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setUpdatedAt(Instant.now());
        log.info("Payment refunded: id={}", paymentId);
        return toResponse(paymentRepository.save(payment));
    }

    private Payment findOrThrow(UUID id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(p.getId(), p.getOrderId(), p.getAmount(), p.getCurrency(),
                p.getMethod(), p.getStatus(), p.getProviderRef(), p.getCreatedAt());
    }
}
