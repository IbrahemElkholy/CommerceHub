package com.commercehub.inventory.controller;

import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import com.commercehub.inventory.dto.StockAdjustmentRequest;
import com.commercehub.inventory.dto.StockAdjustmentResponse;
import com.commercehub.inventory.dto.StockItemResponse;
import com.commercehub.inventory.entity.StockItem;
import com.commercehub.inventory.repository.StockAdjustmentRepository;
import com.commercehub.inventory.repository.StockItemRepository;
import com.commercehub.inventory.service.InventoryServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory/stock")
@Tag(name = "Stock")
public class StockController {

    private final StockItemRepository stockItemRepository;
    private final StockAdjustmentRepository adjustmentRepository;
    private final InventoryServiceImpl inventoryService;

    public StockController(StockItemRepository stockItemRepository,
                           StockAdjustmentRepository adjustmentRepository,
                           InventoryServiceImpl inventoryService) {
        this.stockItemRepository = stockItemRepository;
        this.adjustmentRepository = adjustmentRepository;
        this.inventoryService = inventoryService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    @Operation(summary = "List all stock items")
    public ApiResponse<PagedResponse<StockItemResponse>> list(@PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(
                stockItemRepository.findAll(pageable).map(this::toStockResponse)));
    }

    @GetMapping("/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    @Operation(summary = "Get stock for a product across all warehouses")
    public ApiResponse<List<StockItemResponse>> getByProduct(@PathVariable UUID productId) {
        return ApiResponse.ok(stockItemRepository.findAllByProductId(productId).stream()
                .map(this::toStockResponse).toList());
    }

    @GetMapping("/low")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE')")
    @Operation(summary = "List low stock items")
    public ApiResponse<List<StockItemResponse>> getLowStock() {
        return ApiResponse.ok(stockItemRepository.findLowStockItems().stream()
                .map(this::toStockResponse).toList());
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @Operation(summary = "Adjust stock quantity")
    public ApiResponse<Void> adjust(@Valid @RequestBody StockAdjustmentRequest request,
                                     @AuthenticationPrincipal UserDetails principal) {
        inventoryService.adjustStock(request, UUID.fromString(principal.getUsername()));
        return ApiResponse.ok();
    }

    @GetMapping("/adjustments")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get stock adjustment audit log")
    public ApiResponse<PagedResponse<StockAdjustmentResponse>> getAdjustments(@PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(
                adjustmentRepository.findAll(pageable).map(a -> new StockAdjustmentResponse(
                        a.getId(), a.getQuantityDelta(), a.getReason(), a.getAdjustedBy(), a.getCreatedAt()))));
    }

    private StockItemResponse toStockResponse(StockItem s) {
        return new StockItemResponse(
                s.getId(), s.getProductId(),
                s.getWarehouse().getId(), s.getWarehouse().getName(),
                s.getQuantityOnHand(), s.getQuantityReserved(),
                s.getQuantityAvailable(), s.getLowStockThreshold());
    }
}
