CREATE TABLE stock_adjustments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_item_id   UUID NOT NULL REFERENCES stock_items(id),
    adjusted_by     UUID NOT NULL,
    quantity_delta  INT NOT NULL,
    reason          VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
