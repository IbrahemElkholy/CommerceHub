package com.commercehub.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

public record ApiErrorResponse(
        boolean success,
        ErrorDetail error
) {
    public static ApiErrorResponse of(int status, String code, String message, String path, String traceId, List<FieldError> fieldErrors) {
        return new ApiErrorResponse(false, new ErrorDetail(status, code, message, path, traceId, Instant.now(), fieldErrors));
    }

    public static ApiErrorResponse of(int status, String code, String message, String path, String traceId) {
        return of(status, code, message, path, traceId, List.of());
    }

    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public record ErrorDetail(
            int status,
            String code,
            String message,
            String path,
            String traceId,
            Instant timestamp,
            List<FieldError> fieldErrors
    ) {}
}
