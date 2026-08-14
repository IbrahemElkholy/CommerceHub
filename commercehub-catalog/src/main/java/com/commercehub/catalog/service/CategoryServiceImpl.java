package com.commercehub.catalog.service;

import com.commercehub.catalog.dto.CategoryResponse;
import com.commercehub.catalog.dto.CreateCategoryRequest;
import com.commercehub.catalog.dto.UpdateCategoryRequest;
import com.commercehub.catalog.entity.Category;
import com.commercehub.catalog.mapper.CategoryMapper;
import com.commercehub.catalog.repository.CategoryRepository;
import com.commercehub.common.exception.BusinessException;
import com.commercehub.common.exception.ConflictException;
import com.commercehub.common.exception.ResourceNotFoundException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public CategoryServiceImpl(CategoryRepository categoryRepository, CategoryMapper categoryMapper) {
        this.categoryRepository = categoryRepository;
        this.categoryMapper = categoryMapper;
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable("categories")
    public List<CategoryResponse> getCategoryTree() {
        return categoryRepository.findAllByParentIsNull().stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsByName(request.name())) {
            throw new ConflictException("Category name already exists: " + request.name(), "CATEGORY_NAME_EXISTS");
        }
        Category category = new Category();
        category.setName(request.name());
        category.setSlug(request.slug());
        category.setDescription(request.description());
        if (request.parentId() != null) {
            Category parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found", "CATEGORY_NOT_FOUND"));
            category.setParent(parent);
        }
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        Category category = findOrThrow(id);
        if (request.name() != null) category.setName(request.name());
        if (request.slug() != null) category.setSlug(request.slug());
        if (request.description() != null) category.setDescription(request.description());
        if (request.parentId() != null) {
            Category parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found", "CATEGORY_NOT_FOUND"));
            category.setParent(parent);
        }
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    @CacheEvict(value = "categories", allEntries = true)
    public void deleteCategory(Long id) {
        Category category = findOrThrow(id);
        if (!category.getChildren().isEmpty()) {
            throw new BusinessException("Cannot delete category with subcategories", "CATEGORY_HAS_CHILDREN") {};
        }
        categoryRepository.delete(category);
    }

    private Category findOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id, "CATEGORY_NOT_FOUND"));
    }
}
