package com.commercehub.identity.controller;

import com.commercehub.common.response.ApiResponse;
import com.commercehub.common.response.PagedResponse;
import com.commercehub.identity.dto.AddressResponse;
import com.commercehub.identity.dto.AssignRoleRequest;
import com.commercehub.identity.dto.ChangePasswordRequest;
import com.commercehub.identity.dto.CreateAddressRequest;
import com.commercehub.identity.dto.UpdateAddressRequest;
import com.commercehub.identity.dto.UpdateUserRequest;
import com.commercehub.identity.dto.UserResponse;
import com.commercehub.identity.dto.UserSummaryResponse;
import com.commercehub.identity.entity.User;
import com.commercehub.identity.entity.UserStatus;
import com.commercehub.identity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get own profile")
    public ApiResponse<UserResponse> getMe(@AuthenticationPrincipal User principal) {
        return ApiResponse.ok(userService.getOwnProfile(principal.getId()));
    }

    @PostMapping("/me/change-password")
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Change own password")
    public void changePassword(@AuthenticationPrincipal User principal,
                               @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(principal.getId(), request);
    }

    @PatchMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update own profile")
    public ApiResponse<UserResponse> updateMe(@AuthenticationPrincipal User principal,
                                               @RequestBody UpdateUserRequest request) {
        return ApiResponse.ok(userService.updateOwnProfile(principal.getId(), request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all users (admin)")
    public ApiResponse<PagedResponse<UserSummaryResponse>> listUsers(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(PagedResponse.from(userService.getAllUsers(pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user by ID (admin)")
    public ApiResponse<UserResponse> getUserById(@PathVariable UUID id) {
        return ApiResponse.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user status (admin)")
    public ApiResponse<UserResponse> updateStatus(@PathVariable UUID id,
                                                   @RequestParam UserStatus status) {
        return ApiResponse.ok(userService.updateUserStatus(id, status));
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign a role to a user (admin)")
    public ApiResponse<UserResponse> assignRole(@PathVariable UUID id,
                                                @Valid @RequestBody AssignRoleRequest request) {
        return ApiResponse.ok(userService.assignRole(id, request));
    }

    @DeleteMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Remove a role from a user (admin)")
    public ApiResponse<UserResponse> removeRole(@PathVariable UUID id,
                                                @Valid @RequestBody AssignRoleRequest request) {
        return ApiResponse.ok(userService.removeRole(id, request));
    }

    @GetMapping("/me/addresses")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "List own addresses")
    public ApiResponse<List<AddressResponse>> getAddresses(@AuthenticationPrincipal User principal) {
        return ApiResponse.ok(userService.getAddresses(principal.getId()));
    }

    @PostMapping("/me/addresses")
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add a new address")
    public ApiResponse<AddressResponse> addAddress(@AuthenticationPrincipal User principal,
                                                    @Valid @RequestBody CreateAddressRequest request) {
        return ApiResponse.ok(userService.addAddress(principal.getId(), request));
    }

    @PutMapping("/me/addresses/{addressId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Update an address")
    public ApiResponse<AddressResponse> updateAddress(@AuthenticationPrincipal User principal,
                                                       @PathVariable UUID addressId,
                                                       @RequestBody UpdateAddressRequest request) {
        return ApiResponse.ok(userService.updateAddress(principal.getId(), addressId, request));
    }

    @DeleteMapping("/me/addresses/{addressId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete an address")
    public void deleteAddress(@AuthenticationPrincipal User principal, @PathVariable UUID addressId) {
        userService.deleteAddress(principal.getId(), addressId);
    }

    @PatchMapping("/me/addresses/{addressId}/default")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Set address as default")
    public ApiResponse<Void> setDefault(@AuthenticationPrincipal User principal, @PathVariable UUID addressId) {
        userService.setDefaultAddress(principal.getId(), addressId);
        return ApiResponse.ok();
    }
}
