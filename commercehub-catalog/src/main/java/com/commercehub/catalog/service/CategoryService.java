package com.commercehub.catalog.service;

import com.commercehub.catalog.dto.CategoryResponse;
import com.commercehub.catalog.dto.CreateCategoryRequest;
import com.commercehub.catalog.dto.UpdateCategoryRequest;

import java.util.List;

public interface CategoryService {

    List<CategoryResponse> getCategoryTree();

    CategoryResponse createCategory(CreateCategoryRequest request);

    CategoryResponse updateCategory(Long id, UpdateCategoryRequest request);

    void deleteCategory(Long id);
}
