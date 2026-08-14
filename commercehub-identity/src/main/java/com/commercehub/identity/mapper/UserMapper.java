package com.commercehub.identity.mapper;

import com.commercehub.identity.dto.AddressResponse;
import com.commercehub.identity.dto.UserResponse;
import com.commercehub.identity.dto.UserSummaryResponse;
import com.commercehub.identity.entity.Address;
import com.commercehub.identity.entity.Role;
import com.commercehub.identity.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "roles", source = "roles", qualifiedByName = "rolesToStrings")
    UserResponse toResponse(User user);

    @Mapping(target = "fullName", expression = "java(user.getFirstName() + \" \" + user.getLastName())")
    UserSummaryResponse toSummaryResponse(User user);

    @Mapping(target = "isDefault", source = "default")
    AddressResponse toAddressResponse(Address address);

    @Named("rolesToStrings")
    default Set<String> rolesToStrings(Set<Role> roles) {
        if (roles == null) return Set.of();
        return roles.stream().map(r -> r.getName().name()).collect(Collectors.toSet());
    }
}
