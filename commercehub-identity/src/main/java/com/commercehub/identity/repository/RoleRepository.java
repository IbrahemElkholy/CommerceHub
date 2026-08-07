package com.commercehub.identity.repository;

import com.commercehub.identity.entity.Role;
import com.commercehub.identity.entity.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(RoleName name);
}
