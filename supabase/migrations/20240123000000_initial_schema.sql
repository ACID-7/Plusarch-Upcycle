-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'operator');
CREATE TYPE inquiry_status AS ENUM ('new', 'seen', 'closed');
CREATE TYPE custom_order_status AS ENUM ('new', 'in_progress', 'done');
CREATE TYPE conversation_status AS ENUM ('open', 'pending', 'closed');
CREATE TYPE message_sender AS ENUM ('user', 'admin');
-- Profiles table
CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Roles table
CREATE TABLE roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'operator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE
    SET NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        materials TEXT,
        care TEXT,
        price_lkr NUMERIC NOT NULL CHECK (price_lkr > 0),
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Product images table
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Gallery items table
CREATE TABLE gallery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- FAQs table
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Inquiries table
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE
    SET NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status inquiry_status DEFAULT 'new',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Custom orders table
CREATE TABLE custom_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    style TEXT,
    colors TEXT,
    budget_range TEXT,
    deadline DATE,
    notes TEXT,
    status custom_order_status DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Custom order images table
CREATE TABLE custom_order_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    custom_order_id UUID NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status conversation_status DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type message_sender NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- AI conversations table
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        escalated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- AI messages table
CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    sender_type message_sender NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Site settings table
CREATE TABLE site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Blocked users table
CREATE TABLE blocked_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create indexes for better performance
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_custom_orders_user_id ON custom_orders(user_id);
CREATE INDEX idx_custom_orders_status ON custom_orders(status);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(ai_conversation_id);
-- Full-text search indexes
CREATE INDEX idx_products_fts ON products USING gin(
    to_tsvector(
        'english',
        name || ' ' || description || ' ' || materials
    )
);
CREATE INDEX idx_faqs_fts ON faqs USING gin(
    to_tsvector('english', question || ' ' || answer)
);
-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_order_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Roles policies (admin only)
CREATE POLICY "Admins can manage roles" ON roles FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.user_id = auth.uid()
            AND r.role = 'admin'
    )
);
-- Public read policies
CREATE POLICY "Public can read categories" ON categories FOR
SELECT USING (true);
CREATE POLICY "Public can read products" ON products FOR
SELECT USING (true);
CREATE POLICY "Public can read product images" ON product_images FOR
SELECT USING (true);
CREATE POLICY "Public can read gallery items" ON gallery_items FOR
SELECT USING (true);
CREATE POLICY "Public can read FAQs" ON faqs FOR
SELECT USING (true);
-- Site settings public read (but only specific keys)
CREATE POLICY "Public can read public site settings" ON site_settings FOR
SELECT USING (
        key IN (
            'whatsapp_number',
            'email',
            'social_links',
            'business_hours',
            'lkr_to_usd_rate',
            'operator_available'
        )
    );
-- User policies for inquiries and custom orders
CREATE POLICY "Users can read their own inquiries" ON inquiries FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own inquiries" ON inquiries FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read their own custom orders" ON custom_orders FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own custom orders" ON custom_orders FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Conversations and messages
CREATE POLICY "Users can read their own conversations" ON conversations FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own conversations" ON conversations FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read messages from their conversations" ON messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_id
                AND c.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can send messages to their conversations" ON messages FOR
INSERT WITH CHECK (
        sender_type = 'user'
        AND EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_id
                AND c.user_id = auth.uid()
        )
        AND NOT EXISTS (
            SELECT 1
            FROM blocked_users b
            WHERE b.user_id = auth.uid()
        )
    );
-- AI conversations
CREATE POLICY "Users can read their own AI conversations" ON ai_conversations FOR
SELECT USING (
        auth.uid() = user_id
        OR user_id IS NULL
    );
CREATE POLICY "Users can create AI conversations" ON ai_conversations FOR
INSERT WITH CHECK (
        auth.uid() = user_id
        OR user_id IS NULL
    );
CREATE POLICY "Users can read AI messages from their conversations" ON ai_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM ai_conversations ac
            WHERE ac.id = ai_conversation_id
                AND (
                    ac.user_id = auth.uid()
                    OR ac.user_id IS NULL
                )
        )
    );
CREATE POLICY "Users can send AI messages to their conversations" ON ai_messages FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM ai_conversations ac
            WHERE ac.id = ai_conversation_id
                AND (
                    ac.user_id = auth.uid()
                    OR ac.user_id IS NULL
                )
        )
    );
-- Admin/operator policies
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.user_id = auth.uid()
            AND r.role IN ('admin', 'operator')
    )
);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.user_id = auth.uid()
            AND r.role = 'admin'
    )
);
CREATE POLICY "Admins can manage product images" ON product_images FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.user_id = auth.uid()
            AND r.role = 'admin'
    )
);
CREATE POLICY "Admins can manage gallery items" ON gallery_items FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.user_id = auth.uid()
            AND r.role = 'admin'
    )
);
CREATE POLICY "Admins can manage FAQs" ON faqs FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.user_id = auth.uid()
            AND r.role = 'admin'
    )
);
CREATE POLICY "Admins can read all inquiries" ON inquiries FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM roles r
            WHERE r.user_id = auth.uid()
                AND r.role IN ('admin', 'operator')
        )
    );
CREATE POLICY "Admins can update inquiries" ON inquiries FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM roles r
            WHERE r.user_id = auth.uid()
                AND r.role IN ('admin', 'operator')
        )
    );
CREATE POLICY "Admins can read all custom orders" ON custom_orders FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM roles r
            WHERE r.user_id = auth.uid()
                AND r.role IN ('admin', 'operator')
        )
    );
CREATE POLICY "Admins can update custom orders" ON custom_orders FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM roles r
            WHERE r.user_id = auth.uid()
                AND r.role IN ('admin', 'operator')
        )
    );
CREATE POLICY "Admins can read all conversations" ON conversations FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM roles r
            WHERE r.user_id = auth.uid()
                AND r.role IN ('admin', 'operator')
        )
    );
CREATE POLICY "Admins can update conversations" ON conversations FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM roles r
            WHERE r.user_id = auth.uid()
                AND r.role IN ('admin', 'operator')
        )
    );
CREATE POLICY "Admins can read all messages" ON messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM roles r
            WHERE r.user_id = auth.uid()
                AND r.role IN ('admin', 'operator')
        )
    );
CREATE POLICY "Admins can send messages" ON messages FOR
INSERT WITH CHECK (
        sender_type = 'admin'
        AND EXISTS (
            SELECT 1
            FROM roles r
            WHERE r.user_id = auth.uid()
                AND r.role IN ('admin', 'operator')
        )
    );
CREATE POLICY "Admins can manage site settings" ON site_settings FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.user_id = auth.uid()
            AND r.role = 'admin'
    )
);
CREATE POLICY "Admins can manage blocked users" ON blocked_users FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM roles r
        WHERE r.user_id = auth.uid()
            AND r.role = 'admin'
    )
);
-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_site_settings_updated_at BEFORE
UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message() RETURNS TRIGGER AS $$ BEGIN
UPDATE conversations
SET last_message_at = NEW.created_at
WHERE id = NEW.conversation_id;
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_conversation_last_message_trigger
AFTER
INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();