package com.commercehub.common.exception;

public class InvalidOrderStateException extends BusinessException {

    public InvalidOrderStateException(String message) {
        super("INVALID_ORDER_STATE", message);
    }

    public InvalidOrderStateException(String currentStatus, String targetStatus) {
        super("INVALID_ORDER_STATE",
                "Cannot transition order from '" + currentStatus + "' to '" + targetStatus + "'.");
    }
}
