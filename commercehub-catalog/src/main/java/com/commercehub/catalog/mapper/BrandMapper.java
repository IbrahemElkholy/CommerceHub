package com.commercehub.catalog.mapper;

import com.commercehub.catalog.dto.BrandResponse;
import com.commercehub.catalog.entity.Brand;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface BrandMapper {
    BrandResponse toResponse(Brand brand);
}
