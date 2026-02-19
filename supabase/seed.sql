-- Seed data for Plusarch Upcycle
-- Insert categories
INSERT INTO categories (name, slug)
VALUES ('Earrings', 'earrings'),
    ('Necklaces', 'necklaces'),
    ('Bracelets', 'bracelets'),
    ('Rings', 'rings');
-- Insert sample products
INSERT INTO products (
        category_id,
        name,
        slug,
        description,
        materials,
        care,
        price_lkr,
        is_featured
    )
VALUES (
        (
            SELECT id
            FROM categories
            WHERE slug = 'earrings'
        ),
        'Recycled Silver Hoop Earrings',
        'recycled-silver-hoop-earrings',
        'Beautiful hoop earrings made from recycled silver with a modern twist.',
        'Recycled silver, sustainable packaging',
        'Avoid contact with chemicals, store in jewelry box',
        2500,
        true
    ),
    (
        (
            SELECT id
            FROM categories
            WHERE slug = 'necklaces'
        ),
        'Upcycled Bead Necklace',
        'upcycled-bead-necklace',
        'Handcrafted necklace using upcycled beads from various sources.',
        'Upcycled glass beads, recycled metals',
        'Wipe with soft cloth, avoid water exposure',
        3500,
        true
    ),
    (
        (
            SELECT id
            FROM categories
            WHERE slug = 'bracelets'
        ),
        'Eco Leather Bracelet',
        'eco-leather-bracelet',
        'Stylish bracelet made from sustainable leather alternatives.',
        'Vegan leather, recycled metals',
        'Keep away from moisture, clean with dry cloth',
        1800,
        true
    ),
    (
        (
            SELECT id
            FROM categories
            WHERE slug = 'rings'
        ),
        'Minimalist Gold-Plated Ring',
        'minimalist-gold-plated-ring',
        'Simple yet elegant ring with gold plating on recycled metals.',
        'Recycled metals, gold plating',
        'Remove when washing hands, store safely',
        1200,
        false
    ),
    (
        (
            SELECT id
            FROM categories
            WHERE slug = 'earrings'
        ),
        'Crystal Drop Earrings',
        'crystal-drop-earrings',
        'Elegant earrings featuring upcycled crystals.',
        'Upcycled crystals, silver findings',
        'Handle with care, avoid dropping',
        3200,
        true
    ),
    (
        (
            SELECT id
            FROM categories
            WHERE slug = 'necklaces'
        ),
        'Layered Chain Necklace',
        'layered-chain-necklace',
        'Multi-layered necklace with recycled chain links.',
        'Recycled silver chains',
        'Keep chains untangled, polish occasionally',
        4200,
        false
    );
-- Insert sample FAQs
INSERT INTO faqs (question, answer, sort_order)
VALUES (
        'How are your products made?',
        'All our jewelry is handcrafted using upcycled and recycled materials. We source materials from various sustainable suppliers and give them new life through our creative designs.',
        1
    ),
    (
        'What materials do you use?',
        'We primarily use recycled metals (silver, gold-plated), upcycled crystals and beads, sustainable leather alternatives, and other eco-friendly materials. All materials are sourced responsibly.',
        2
    ),
    (
        'How do I care for my jewelry?',
        'Care instructions vary by piece. Generally, avoid exposure to water and chemicals, store in a jewelry box, and clean with a soft cloth. Specific care instructions are provided with each purchase.',
        3
    ),
    (
        'Do you offer custom orders?',
        'Yes! We love creating custom pieces. Contact us through our custom order form or WhatsApp to discuss your vision, budget, and timeline.',
        4
    ),
    (
        'What is your return policy?',
        'We offer a 30-day return policy for unused items in original condition. Due to the handmade nature of our products, some items may not be returnable. Please check individual product descriptions.',
        5
    ),
    (
        'How long does shipping take?',
        'Shipping typically takes 3-7 business days within Sri Lanka. International shipping may take 2-4 weeks depending on the destination. We use eco-friendly packaging and carbon-neutral shipping options.',
        6
    ),
    (
        'Are your products hypoallergenic?',
        'Most of our pieces use sterling silver or gold-plated materials which are generally hypoallergenic. However, we recommend checking with a healthcare professional if you have known metal allergies.',
        7
    );
-- Insert site settings
INSERT INTO site_settings (key, value)
VALUES ('whatsapp_number', '"0712345678"'),
    ('email', '"hello@plusarchupcycle.com"'),
    (
        'social_links',
        '{"instagram": "https://www.instagram.com/plusarch_upcycle/", "facebook": "https://facebook.com/plusarchupcycle"}'
    ),
    (
        'business_hours',
        '"Mon-Fri: 9AM-6PM, Sat: 10AM-4PM"'
    ),
    ('lkr_to_usd_rate', '0.003'),
    ('operator_available', 'true'),
    (
        'mission',
        '"At Plusarch Upcycle, we believe in giving materials a second life. Every piece tells a story of transformation and sustainability."'
    ),
    (
        'upcycling_process',
        '"Our upcycling process involves carefully selecting discarded materials, cleaning and preparing them, then handcrafting them into beautiful, functional jewelry pieces."'
    ),
    (
        'materials_sustainability',
        '"We source materials from responsible suppliers, focusing on recycled metals, upcycled crystals, and sustainable alternatives to traditional materials."'
    ),
    (
        'environmental_impact',
        '"By choosing upcycled jewelry, you''re helping reduce waste in landfills and supporting sustainable fashion. Each purchase contributes to a more circular economy."'
    );
-- Insert sample gallery items (placeholder paths)
INSERT INTO gallery_items (path, caption, sort_order)
VALUES (
        '/gallery/workshop.jpg',
        'Our sustainable workshop',
        1
    ),
    (
        '/gallery/materials.jpg',
        'Upcycled materials ready for transformation',
        2
    ),
    (
        '/gallery/handcrafting.jpg',
        'Handcrafting process',
        3
    ),
    (
        '/gallery/finished-pieces.jpg',
        'Finished upcycled jewelry pieces',
        4
    );
-- Insert sample product variants
INSERT INTO product_variants (
        product_id,
        name,
        value,
        price_modifier_lkr,
        stock_quantity
    )
SELECT p.id,
    'Size',
    'Standard',
    0,
    10
FROM products p
WHERE p.name = 'Recycled Silver Hoop Earrings'
UNION ALL
SELECT p.id,
    'Size',
    'Large',
    500,
    5
FROM products p
WHERE p.name = 'Recycled Silver Hoop Earrings'
UNION ALL
SELECT p.id,
    'Color',
    'Silver',
    0,
    8
FROM products p
WHERE p.name = 'Upcycled Bead Necklace'
UNION ALL
SELECT p.id,
    'Color',
    'Gold',
    300,
    6
FROM products p
WHERE p.name = 'Upcycled Bead Necklace';
-- Insert sample newsletter subscriptions
INSERT INTO newsletter_subscriptions (email)
VALUES ('eco.fashion@example.com'),
    ('sustainable.living@example.com'),
    ('green.jewelry@example.com');
-- Insert sample product reviews
INSERT INTO product_reviews (
        user_id,
        product_id,
        rating,
        title,
        comment,
        is_verified_purchase
    )
SELECT '00000000-0000-0000-0000-000000000001'::uuid,
    -- This would need to be a real user ID
    p.id,
    5,
    'Absolutely stunning!',
    'These earrings are beautifully crafted and I love knowing they''re made from recycled materials.',
    true
FROM products p
WHERE p.name = 'Recycled Silver Hoop Earrings'
UNION ALL
SELECT '00000000-0000-0000-0000-000000000001'::uuid,
    p.id,
    4,
    'Great quality',
    'Love the unique design and the fact that it''s upcycled. Very comfortable to wear.',
    true
FROM products p
WHERE p.name = 'Upcycled Bead Necklace';
