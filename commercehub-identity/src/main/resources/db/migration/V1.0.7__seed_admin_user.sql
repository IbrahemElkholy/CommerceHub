-- Admin user: email=admin@commercehub.com  password=Admin@1234
-- Hash generated with BCrypt cost 12
INSERT INTO users (id, email, password_hash, first_name, last_name, status, email_verified)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@commercehub.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i',
    'Admin',
    'User',
    'ACTIVE',
    true
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT 'a0000000-0000-0000-0000-000000000001', r.id
FROM roles r
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;
