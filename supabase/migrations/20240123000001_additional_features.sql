-- Add shopping cart, wishlist, orders, and reviews functionality
-- Shopping cart table
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);
-- Wishlist table
CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);
-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'confirmed',
            'processing',
            'shipped',
            'delivered',
            'cancelled'
        )
    ),
    total_amount_lkr NUMERIC NOT NULL CHECK (total_amount_lkr > 0),
    shipping_address JSONB,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed', 'refunded')
    ),
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_lkr NUMERIC NOT NULL CHECK (price_lkr > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Product reviews table
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    title TEXT,
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);
-- Newsletter subscriptions table
CREATE TABLE newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE
);
-- User addresses table
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address_line_1 TEXT NOT NULL,
    address_line_2 TEXT,
    city TEXT NOT NULL,
    state TEXT,
    postal_code TEXT,
    country TEXT NOT NULL DEFAULT 'Sri Lanka',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Product variants table (for sizes, colors, etc.)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    -- e.g., "Size", "Color"
    value TEXT NOT NULL,
    -- e.g., "Small", "Red"
    price_modifier_lkr NUMERIC DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS on new tables
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
-- RLS Policies for cart_items
CREATE POLICY "Users can manage their own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);
-- RLS Policies for wishlist_items
CREATE POLICY "Users can manage their own wishlist" ON wishlist_items FOR ALL USING (auth.uid() = user_id);
-- RLS Policies for orders
CREATE POLICY "Users can view their own orders" ON orders FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own orders" ON orders FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all orders" ON orders FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.user_id = auth.uid()
            AND r.role IN ('admin', 'operator')
    )
);
-- RLS Policies for order_items
CREATE POLICY "Users can view their own order items" ON order_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM orders o
            WHERE o.id = order_items.order_id
                AND o.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can create their own order items" ON order_items FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM orders o
            WHERE o.id = order_items.order_id
                AND o.user_id = auth.uid()
        )
    );
CREATE POLICY "Admins can manage all order items" ON order_items FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.user_id = auth.uid()
            AND r.role IN ('admin', 'operator')
    )
);
-- RLS Policies for product_reviews
CREATE POLICY "Anyone can read product reviews" ON product_reviews FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own reviews" ON product_reviews FOR ALL USING (auth.uid() = user_id);
-- RLS Policies for newsletter_subscriptions
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscriptions FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can manage their own subscription" ON newsletter_subscriptions FOR ALL USING (
    email = (
        SELECT email
        FROM auth.users
        WHERE id = auth.uid()
    )
);
-- RLS Policies for user_addresses
CREATE POLICY "Users can manage their own addresses" ON user_addresses FOR ALL USING (auth.uid() = user_id);
-- RLS Policies for product_variants
CREATE POLICY "Anyone can read product variants" ON product_variants FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage product variants" ON product_variants FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.user_id = auth.uid()
            AND r.role = 'admin'
    )
);
-- Indexes for performance
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
-- Triggers for updated_at
CREATE TRIGGER update_cart_items_updated_at BEFORE
UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE
UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE
UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Function to update product stock when order is placed
CREATE OR REPLACE FUNCTION update_product_stock_on_order() RETURNS TRIGGER AS $$ BEGIN -- This would be implemented based on your inventory management needs
    -- For now, just return the new record
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Function to calculate order total
CREATE OR REPLACE FUNCTION calculate_order_total(order_uuid UUID) RETURNS NUMERIC AS $$
DECLARE total NUMERIC := 0;
BEGIN
SELECT SUM(oi.quantity * oi.price_lkr) INTO total
FROM order_items oi
WHERE oi.order_id = order_uuid;
RETURN COALESCE(total, 0);
END;
$$ LANGUAGE plpgsql;
