package com.commercehub.cart.service;

import java.math.BigDecimal;
import java.util.UUID;

public interface ProductPriceLookup {
    BigDecimal getPrice(UUID productId);
}
