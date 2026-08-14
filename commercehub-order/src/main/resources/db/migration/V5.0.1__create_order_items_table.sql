CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    product_name    VARCHAR(255) NOT NULL,
    product_sku     VARCHAR(100) NOT NULL,
    quantity        INT NOT NULL CHECK (quantity >= 1),
    unit_price      NUMERIC(12, 2) NOT NULL,
    line_total      NUMERIC(12, 2) NOT NULL
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
