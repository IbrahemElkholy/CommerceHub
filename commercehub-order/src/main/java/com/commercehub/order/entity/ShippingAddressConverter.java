package com.commercehub.order.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class ShippingAddressConverter implements AttributeConverter<ShippingAddress, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(ShippingAddress attribute) {
        if (attribute == null) return null;
        try {
            return MAPPER.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Cannot serialize ShippingAddress", e);
        }
    }

    @Override
    public ShippingAddress convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        try {
            return MAPPER.readValue(dbData, ShippingAddress.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Cannot deserialize ShippingAddress", e);
        }
    }
}
