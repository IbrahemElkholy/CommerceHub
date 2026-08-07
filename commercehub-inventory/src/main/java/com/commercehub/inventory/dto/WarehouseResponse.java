package com.commercehub.inventory.dto;

import java.util.UUID;

public record WarehouseResponse(UUID id, String name, String code, String address, boolean active) {}
