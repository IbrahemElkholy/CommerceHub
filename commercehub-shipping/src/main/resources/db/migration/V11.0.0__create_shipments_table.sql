CREATE TABLE shipments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id),
    tracking_number VARCHAR(100),
    carrier         VARCHAR(50),
    status          VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    shipped_at      TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    estimated_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
