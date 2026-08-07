CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku         VARCHAR(100) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    brand_id    BIGINT REFERENCES brands(id),
    weight_kg   NUMERIC(8, 3),
    length_cm   NUMERIC(8, 2),
    width_cm    NUMERIC(8, 2),
    height_cm   NUMERIC(8, 2),
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_brand_id ON products(brand_id);
