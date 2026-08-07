package com.commercehub.identity.service;

import com.commercehub.identity.dto.AddressResponse;
import com.commercehub.identity.dto.CreateAddressRequest;
import com.commercehub.identity.dto.UpdateAddressRequest;
import com.commercehub.identity.dto.AssignRoleRequest;
import com.commercehub.identity.dto.ChangePasswordRequest;
import com.commercehub.identity.dto.UpdateUserRequest;
import com.commercehub.identity.dto.UserResponse;
import com.commercehub.identity.dto.UserSummaryResponse;
import com.commercehub.identity.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface UserService {

    UserResponse getOwnProfile(UUID userId);

    UserResponse updateOwnProfile(UUID userId, UpdateUserRequest request);

    Page<UserSummaryResponse> getAllUsers(Pageable pageable);

    UserResponse getUserById(UUID id);

    UserResponse updateUserStatus(UUID id, UserStatus status);

    List<AddressResponse> getAddresses(UUID userId);

    AddressResponse addAddress(UUID userId, CreateAddressRequest request);

    AddressResponse updateAddress(UUID userId, UUID addressId, UpdateAddressRequest request);

    void deleteAddress(UUID userId, UUID addressId);

    void setDefaultAddress(UUID userId, UUID addressId);

    void changePassword(UUID userId, ChangePasswordRequest request);

    UserResponse assignRole(UUID userId, AssignRoleRequest request);

    UserResponse removeRole(UUID userId, AssignRoleRequest request);
}
