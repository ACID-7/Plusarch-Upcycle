-- Align schema with implemented application behavior (non-chatbot scope).

-- Add product visibility status used by catalog/admin pages.
ALTER TABLE products
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'hidden'));

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Ensure currency reciprocal exists for converter fallback.
INSERT INTO site_settings (key, value)
VALUES ('usd_to_lkr_rate', '330')
ON CONFLICT (key) DO NOTHING;
