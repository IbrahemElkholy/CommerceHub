package com.commercehub.catalog.mapper;

import com.commercehub.catalog.dto.ProductImageResponse;
import com.commercehub.catalog.dto.ProductResponse;
import com.commercehub.catalog.dto.ProductSummaryResponse;
import com.commercehub.catalog.entity.Product;
import com.commercehub.catalog.entity.ProductImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

@Mapper(componentModel = "spring", uses = {BrandMapper.class, CategoryMapper.class})
public interface ProductMapper {

    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "updatedAt")
    ProductResponse toResponse(Product product);

    @Mapping(target = "primaryImageUrl", source = "images", qualifiedByName = "primaryImageUrl")
    @Mapping(target = "brandName", source = "brand.name")
    ProductSummaryResponse toSummaryResponse(Product product);

    @Mapping(target = "isPrimary", source = "primary")
    ProductImageResponse toImageResponse(ProductImage image);

    @Named("primaryImageUrl")
    default String primaryImageUrl(java.util.List<ProductImage> images) {
        if (images == null) return null;
        return images.stream().filter(ProductImage::isPrimary).findFirst()
                .map(ProductImage::getUrl)
                .orElse(images.isEmpty() ? null : images.get(0).getUrl());
    }
}
