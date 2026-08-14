-- Categories (root first)
INSERT INTO categories (name, slug, description, parent_id) VALUES
    ('Electronics',   'electronics', 'Electronic devices and accessories', NULL),
    ('Clothing',      'clothing',    'Men, women and kids apparel',        NULL),
    ('Home & Garden', 'home-garden', 'Furniture, decor and gardening',     NULL),
    ('Sports',        'sports',      'Sports equipment and activewear',    NULL),
    ('Books',         'books',       'Books, e-books and audiobooks',      NULL)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories
INSERT INTO categories (name, slug, description, parent_id) VALUES
    ('Smartphones',      'smartphones',    'Mobile phones and accessories', (SELECT id FROM categories WHERE slug = 'electronics')),
    ('Laptops',          'laptops',        'Laptops and notebooks',         (SELECT id FROM categories WHERE slug = 'electronics')),
    ('Headphones',       'headphones',     'Headphones and earbuds',        (SELECT id FROM categories WHERE slug = 'electronics')),
    ('Men''s Clothing',  'mens-clothing',  'Clothing for men',              (SELECT id FROM categories WHERE slug = 'clothing')),
    ('Women''s Clothing','womens-clothing','Clothing for women',            (SELECT id FROM categories WHERE slug = 'clothing'))
ON CONFLICT (slug) DO NOTHING;

-- Brands
INSERT INTO brands (name, slug) VALUES
    ('Apple',       'apple'),
    ('Samsung',     'samsung'),
    ('Sony',        'sony'),
    ('Nike',        'nike'),
    ('Adidas',      'adidas'),
    ('Dell',        'dell'),
    ('LG',          'lg'),
    ('Logitech',    'logitech')
ON CONFLICT (slug) DO NOTHING;

-- Products
INSERT INTO products (id, sku, name, description, price, status, brand_id) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'APL-IPH15-128', 'iPhone 15 128GB',
     'Apple iPhone 15 with 128GB storage, A16 Bionic chip, and 48MP camera.',
     999.99, 'ACTIVE',  (SELECT id FROM brands WHERE slug = 'apple')),

    ('b0000000-0000-0000-0000-000000000002', 'APL-MBP14-M3', 'MacBook Pro 14" M3',
     'Apple MacBook Pro 14-inch with M3 chip, 16GB RAM, and 512GB SSD.',
     1999.99, 'ACTIVE', (SELECT id FROM brands WHERE slug = 'apple')),

    ('b0000000-0000-0000-0000-000000000003', 'SAM-S24U-256', 'Samsung Galaxy S24 Ultra',
     'Samsung Galaxy S24 Ultra with 256GB storage, 200MP camera, and S Pen.',
     1299.99, 'ACTIVE', (SELECT id FROM brands WHERE slug = 'samsung')),

    ('b0000000-0000-0000-0000-000000000004', 'SON-WH1000XM5', 'Sony WH-1000XM5',
     'Sony industry-leading noise cancelling wireless headphones.',
     349.99, 'ACTIVE',  (SELECT id FROM brands WHERE slug = 'sony')),

    ('b0000000-0000-0000-0000-000000000005', 'SAM-TV65-QLED', 'Samsung 65" QLED 4K TV',
     'Samsung 65-inch QLED 4K Smart TV with Quantum HDR.',
     1499.99, 'ACTIVE', (SELECT id FROM brands WHERE slug = 'samsung')),

    ('b0000000-0000-0000-0000-000000000006', 'DELL-XPS15-9530', 'Dell XPS 15 9530',
     'Dell XPS 15 with Intel Core i7, 16GB RAM, 512GB SSD, OLED display.',
     1799.99, 'ACTIVE', (SELECT id FROM brands WHERE slug = 'dell')),

    ('b0000000-0000-0000-0000-000000000007', 'NIKE-AM270-BLK', 'Nike Air Max 270 Black',
     'Nike Air Max 270 running shoes in classic black colorway.',
     149.99, 'ACTIVE',  (SELECT id FROM brands WHERE slug = 'nike')),

    ('b0000000-0000-0000-0000-000000000008', 'ADI-UB22-WHT', 'Adidas Ultraboost 22',
     'Adidas Ultraboost 22 running shoes with BOOST midsole.',
     179.99, 'ACTIVE',  (SELECT id FROM brands WHERE slug = 'adidas')),

    ('b0000000-0000-0000-0000-000000000009', 'LOG-MX3S-GRY', 'Logitech MX Master 3S',
     'Logitech MX Master 3S wireless mouse with 8K DPI sensor.',
     99.99, 'ACTIVE',   (SELECT id FROM brands WHERE slug = 'logitech')),

    ('b0000000-0000-0000-0000-000000000010', 'APL-AIRPODPRO2', 'Apple AirPods Pro 2nd Gen',
     'Apple AirPods Pro 2nd generation with Active Noise Cancellation.',
     249.99, 'ACTIVE',  (SELECT id FROM brands WHERE slug = 'apple'))
ON CONFLICT (sku) DO NOTHING;

-- Product Categories
INSERT INTO product_categories (product_id, category_id) VALUES
    ('b0000000-0000-0000-0000-000000000001', (SELECT id FROM categories WHERE slug = 'smartphones')),
    ('b0000000-0000-0000-0000-000000000002', (SELECT id FROM categories WHERE slug = 'laptops')),
    ('b0000000-0000-0000-0000-000000000003', (SELECT id FROM categories WHERE slug = 'smartphones')),
    ('b0000000-0000-0000-0000-000000000004', (SELECT id FROM categories WHERE slug = 'headphones')),
    ('b0000000-0000-0000-0000-000000000005', (SELECT id FROM categories WHERE slug = 'electronics')),
    ('b0000000-0000-0000-0000-000000000006', (SELECT id FROM categories WHERE slug = 'laptops')),
    ('b0000000-0000-0000-0000-000000000007', (SELECT id FROM categories WHERE slug = 'sports')),
    ('b0000000-0000-0000-0000-000000000008', (SELECT id FROM categories WHERE slug = 'sports')),
    ('b0000000-0000-0000-0000-000000000009', (SELECT id FROM categories WHERE slug = 'electronics')),
    ('b0000000-0000-0000-0000-000000000010', (SELECT id FROM categories WHERE slug = 'headphones'))
ON CONFLICT DO NOTHING;

-- Product Images (primary image per product)
INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80', 'iPhone 15 128GB', 0, true),
    ('b0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80', 'MacBook Pro 14 M3', 0, true),
    ('b0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80', 'Samsung Galaxy S24 Ultra', 0, true),
    ('b0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80', 'Sony WH-1000XM5', 0, true),
    ('b0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&q=80', 'Samsung 65 QLED 4K TV', 0, true),
    ('b0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80', 'Dell XPS 15 9530', 0, true),
    ('b0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', 'Nike Air Max 270 Black', 0, true),
    ('b0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80', 'Adidas Ultraboost 22', 0, true),
    ('b0000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&q=80', 'Logitech MX Master 3S', 0, true),
    ('b0000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80', 'Apple AirPods Pro 2nd Gen', 0, true)
ON CONFLICT DO NOTHING;
