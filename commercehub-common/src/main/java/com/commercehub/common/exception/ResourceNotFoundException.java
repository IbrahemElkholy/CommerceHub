package com.commercehub.common.exception;

public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super("RESOURCE_NOT_FOUND", message);
    }

    public ResourceNotFoundException(String resourceName, Object id) {
        super("RESOURCE_NOT_FOUND", resourceName + " with id '" + id + "' was not found.");
    }
}
