package com.commercehub.payment.controller;

import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import com.commercehub.payment.dto.InitiatePaymentRequest;
import com.commercehub.payment.dto.PaymentResponse;
import com.commercehub.payment.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Initiate payment")
    public ApiResponse<PaymentResponse> initiate(@Valid @RequestBody InitiatePaymentRequest request) {
        return ApiResponse.ok(paymentService.initiatePayment(request));
    }

    @GetMapping("/{paymentId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    @Operation(summary = "Get payment by ID")
    public ApiResponse<PaymentResponse> get(@PathVariable UUID paymentId) {
        return ApiResponse.ok(paymentService.getPayment(paymentId));
    }

    @GetMapping("/orders/{orderId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    @Operation(summary = "Get payments for an order")
    public ApiResponse<PagedResponse<PaymentResponse>> getForOrder(@PathVariable UUID orderId,
                                                                    @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(paymentService.getPaymentsForOrder(orderId, pageable)));
    }

    @PostMapping("/{paymentId}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Refund payment")
    public ApiResponse<PaymentResponse> refund(@PathVariable UUID paymentId) {
        return ApiResponse.ok(paymentService.refundPayment(paymentId));
    }
}
