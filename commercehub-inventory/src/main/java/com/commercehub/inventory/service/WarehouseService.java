package com.commercehub.inventory.service;

import com.commercehub.inventory.dto.CreateWarehouseRequest;
import com.commercehub.inventory.dto.UpdateWarehouseRequest;
import com.commercehub.inventory.dto.WarehouseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WarehouseService {

    Page<WarehouseResponse> getAllWarehouses(Pageable pageable);

    WarehouseResponse getWarehouseById(UUID id);

    WarehouseResponse createWarehouse(CreateWarehouseRequest request);

    WarehouseResponse updateWarehouse(UUID id, UpdateWarehouseRequest request);

    WarehouseResponse updateWarehouseStatus(UUID id, boolean active);
}
