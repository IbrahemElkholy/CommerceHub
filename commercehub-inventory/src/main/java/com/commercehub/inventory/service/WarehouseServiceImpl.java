package com.commercehub.inventory.service;

import com.commercehub.common.exception.ConflictException;
import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.inventory.dto.CreateWarehouseRequest;
import com.commercehub.inventory.dto.UpdateWarehouseRequest;
import com.commercehub.inventory.dto.WarehouseResponse;
import com.commercehub.inventory.entity.Warehouse;
import com.commercehub.inventory.repository.WarehouseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;

    public WarehouseServiceImpl(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WarehouseResponse> getAllWarehouses(Pageable pageable) {
        return warehouseRepository.findAll(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public WarehouseResponse getWarehouseById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    @Transactional
    public WarehouseResponse createWarehouse(CreateWarehouseRequest request) {
        if (warehouseRepository.findByCode(request.code()).isPresent()) {
            throw new ConflictException("Warehouse code already exists: " + request.code(), "WAREHOUSE_CODE_EXISTS");
        }
        Warehouse w = new Warehouse();
        w.setName(request.name());
        w.setCode(request.code());
        w.setAddress(request.address());
        return toResponse(warehouseRepository.save(w));
    }

    @Override
    @Transactional
    public WarehouseResponse updateWarehouse(UUID id, UpdateWarehouseRequest request) {
        Warehouse w = findOrThrow(id);
        if (request.name() != null) w.setName(request.name());
        if (request.code() != null) w.setCode(request.code());
        if (request.address() != null) w.setAddress(request.address());
        return toResponse(warehouseRepository.save(w));
    }

    @Override
    @Transactional
    public WarehouseResponse updateWarehouseStatus(UUID id, boolean active) {
        Warehouse w = findOrThrow(id);
        w.setActive(active);
        return toResponse(warehouseRepository.save(w));
    }

    private Warehouse findOrThrow(UUID id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found: " + id));
    }

    private WarehouseResponse toResponse(Warehouse w) {
        return new WarehouseResponse(w.getId(), w.getName(), w.getCode(), w.getAddress(), w.isActive());
    }
}
