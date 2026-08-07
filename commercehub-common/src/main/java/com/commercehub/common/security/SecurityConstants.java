package com.commercehub.common.security;

public final class SecurityConstants {

    private SecurityConstants() {}

    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final String BEARER_PREFIX = "Bearer ";
    public static final String TRACE_ID_HEADER = "X-Request-ID";
    public static final String TRACE_ID_MDC_KEY = "traceId";
    public static final String USER_ID_MDC_KEY = "userId";

    public static final String ROLE_CUSTOMER = "CUSTOMER";
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_WAREHOUSE = "WAREHOUSE";
    public static final String ROLE_SUPPORT = "SUPPORT";
    public static final String ROLE_SYSTEM_ADMIN = "SYSTEM_ADMIN";

    public static final String CLAIM_ROLES = "roles";
    public static final String CLAIM_USER_ID = "userId";
}
