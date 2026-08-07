package com.commercehub.identity.service;

import com.commercehub.common.exception.ResourceNotFoundException;
import com.commercehub.identity.dto.AddressResponse;
import com.commercehub.identity.dto.AssignRoleRequest;
import com.commercehub.identity.dto.ChangePasswordRequest;
import com.commercehub.identity.dto.CreateAddressRequest;
import com.commercehub.identity.dto.UpdateAddressRequest;
import com.commercehub.identity.dto.UpdateUserRequest;
import com.commercehub.identity.dto.UserResponse;
import com.commercehub.identity.dto.UserSummaryResponse;
import com.commercehub.identity.entity.Address;
import com.commercehub.identity.entity.Role;
import com.commercehub.identity.entity.RoleName;
import com.commercehub.identity.entity.User;
import com.commercehub.identity.entity.UserStatus;
import com.commercehub.identity.mapper.UserMapper;
import com.commercehub.identity.repository.AddressRepository;
import com.commercehub.identity.repository.RoleRepository;
import com.commercehub.identity.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository,
                           AddressRepository addressRepository,
                           RoleRepository roleRepository,
                           UserMapper userMapper,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.roleRepository = roleRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getOwnProfile(UUID userId) {
        return userMapper.toResponse(findUserOrThrow(userId));
    }

    @Override
    @Transactional
    public UserResponse updateOwnProfile(UUID userId, UpdateUserRequest request) {
        User user = findUserOrThrow(userId);
        if (request.firstName() != null) user.setFirstName(request.firstName());
        if (request.lastName() != null) user.setLastName(request.lastName());
        if (request.phone() != null) user.setPhone(request.phone());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserSummaryResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toSummaryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        return userMapper.toResponse(findUserOrThrow(id));
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(UUID id, UserStatus status) {
        User user = findUserOrThrow(id);
        user.setStatus(status);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses(UUID userId) {
        return addressRepository.findAllByUserId(userId).stream()
                .map(userMapper::toAddressResponse)
                .toList();
    }

    @Override
    @Transactional
    public AddressResponse addAddress(UUID userId, CreateAddressRequest request) {
        User user = findUserOrThrow(userId);
        Address address = new Address();
        address.setUser(user);
        applyCreateRequest(address, request);
        if (request.isDefault()) {
            clearDefaultAddresses(userId);
        }
        return userMapper.toAddressResponse(addressRepository.save(address));
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(UUID userId, UUID addressId, UpdateAddressRequest request) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found", "ADDRESS_NOT_FOUND"));
        applyUpdateRequest(address, request);
        if (Boolean.TRUE.equals(request.isDefault())) {
            clearDefaultAddresses(userId);
            address.setDefault(true);
        }
        return userMapper.toAddressResponse(addressRepository.save(address));
    }

    @Override
    @Transactional
    public void deleteAddress(UUID userId, UUID addressId) {
        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found", "ADDRESS_NOT_FOUND"));
        addressRepository.delete(address);
    }

    @Override
    @Transactional
    public void setDefaultAddress(UUID userId, UUID addressId) {
        addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found", "ADDRESS_NOT_FOUND"));
        clearDefaultAddresses(userId);
        Address address = addressRepository.findByIdAndUserId(addressId, userId).get();
        address.setDefault(true);
        addressRepository.save(address);
    }

    private User findUserOrThrow(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id, "USER_NOT_FOUND"));
    }

    private void clearDefaultAddresses(UUID userId) {
        addressRepository.findAllByUserId(userId).forEach(a -> {
            if (a.isDefault()) {
                a.setDefault(false);
                addressRepository.save(a);
            }
        });
    }

    private void applyCreateRequest(Address address, CreateAddressRequest req) {
        address.setLabel(req.label());
        address.setStreetLine1(req.streetLine1());
        address.setStreetLine2(req.streetLine2());
        address.setCity(req.city());
        address.setState(req.state());
        address.setPostalCode(req.postalCode());
        address.setCountryCode(req.countryCode());
        address.setDefault(req.isDefault());
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = findUserOrThrow(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public UserResponse assignRole(UUID userId, AssignRoleRequest request) {
        User user = findUserOrThrow(userId);
        RoleName roleName = RoleName.valueOf(request.role().toUpperCase());
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + request.role(), "ROLE_NOT_FOUND"));
        user.getRoles().add(role);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse removeRole(UUID userId, AssignRoleRequest request) {
        User user = findUserOrThrow(userId);
        RoleName roleName = RoleName.valueOf(request.role().toUpperCase());
        user.getRoles().removeIf(r -> r.getName() == roleName);
        return userMapper.toResponse(userRepository.save(user));
    }

    private void applyUpdateRequest(Address address, UpdateAddressRequest req) {
        if (req.label() != null) address.setLabel(req.label());
        if (req.streetLine1() != null) address.setStreetLine1(req.streetLine1());
        if (req.streetLine2() != null) address.setStreetLine2(req.streetLine2());
        if (req.city() != null) address.setCity(req.city());
        if (req.state() != null) address.setState(req.state());
        if (req.postalCode() != null) address.setPostalCode(req.postalCode());
        if (req.countryCode() != null) address.setCountryCode(req.countryCode());
    }
}
