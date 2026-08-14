CREATE INDEX idx_products_fts ON products USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));
