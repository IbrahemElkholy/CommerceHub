package com.commercehub.common.exception;

public class InsufficientStockException extends BusinessException {

    public InsufficientStockException(String message) {
        super("INSUFFICIENT_STOCK", message);
    }

    public InsufficientStockException(String productName, int requested, int available) {
        super("INSUFFICIENT_STOCK",
                "Insufficient stock for '" + productName + "': requested " + requested + ", available " + available + ".");
    }
}
