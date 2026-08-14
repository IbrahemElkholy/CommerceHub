package com.commercehub.payment.service;

import com.commercehub.payment.dto.InitiatePaymentRequest;
import com.commercehub.payment.dto.PaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface PaymentService {

    PaymentResponse initiatePayment(InitiatePaymentRequest request);

    PaymentResponse getPayment(UUID paymentId);

    Page<PaymentResponse> getPaymentsForOrder(UUID orderId, Pageable pageable);

    PaymentResponse refundPayment(UUID paymentId);
}
