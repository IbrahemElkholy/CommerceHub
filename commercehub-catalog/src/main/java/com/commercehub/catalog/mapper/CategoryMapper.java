package com.commercehub.catalog.mapper;

import com.commercehub.catalog.dto.CategoryResponse;
import com.commercehub.catalog.dto.CategorySummaryResponse;
import com.commercehub.catalog.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "children", source = "children")
    CategoryResponse toResponse(Category category);

    CategorySummaryResponse toSummaryResponse(Category category);
}
