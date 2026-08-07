package com.commercehub.inventory.controller;

import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import com.commercehub.inventory.dto.CreateWarehouseRequest;
import com.commercehub.inventory.dto.UpdateWarehouseRequest;
import com.commercehub.inventory.dto.WarehouseResponse;
import com.commercehub.inventory.service.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory/warehouses")
@PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
@Tag(name = "Warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @GetMapping
    @Operation(summary = "List warehouses")
    public ApiResponse<PagedResponse<WarehouseResponse>> list(@PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(warehouseService.getAllWarehouses(pageable)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get warehouse by ID")
    public ApiResponse<WarehouseResponse> getById(@PathVariable UUID id) {
        return ApiResponse.ok(warehouseService.getWarehouseById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create warehouse")
    public ApiResponse<WarehouseResponse> create(@Valid @RequestBody CreateWarehouseRequest request) {
        return ApiResponse.ok(warehouseService.createWarehouse(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update warehouse")
    public ApiResponse<WarehouseResponse> update(@PathVariable UUID id,
                                                  @RequestBody UpdateWarehouseRequest request) {
        return ApiResponse.ok(warehouseService.updateWarehouse(id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Activate/deactivate warehouse")
    public ApiResponse<WarehouseResponse> updateStatus(@PathVariable UUID id,
                                                        @RequestParam boolean active) {
        return ApiResponse.ok(warehouseService.updateWarehouseStatus(id, active));
    }
}
