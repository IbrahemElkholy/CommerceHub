CREATE TABLE stock_reservations (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id      UUID NOT NULL REFERENCES stock_items(id),
    order_id           UUID NOT NULL,
    quantity_reserved  INT NOT NULL CHECK (quantity_reserved > 0),
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_stock_reservations_order_id ON stock_reservations(order_id);
