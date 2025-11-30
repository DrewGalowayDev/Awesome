-- ============================================
-- AWESOME TECHNOLOGIES E-COMMERCE PLATFORM
-- Complete Supabase Database Schema
-- ============================================
-- Created: 2025-11-29
-- Version: 1.0.0
-- Description: Complete database schema for e-commerce platform
--              with admin dashboard, analytics, and WhatsApp integration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMP,
    avatar VARCHAR(500),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User addresses table
CREATE TABLE addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    address_type VARCHAR(50) DEFAULT 'shipping' CHECK (address_type IN ('shipping', 'billing')),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 VARCHAR(500) NOT NULL,
    address_line2 VARCHAR(500),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Kenya',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. CATEGORIES
-- ============================================

CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(50),
    image VARCHAR(500),
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. PRODUCTS
-- ============================================

CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    specifications JSONB,
    price DECIMAL(10,2) NOT NULL,
    old_price DECIMAL(10,2),
    brand VARCHAR(100),
    condition VARCHAR(50) DEFAULT 'new' CHECK (condition IN ('new', 'refurbished')),
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    sku VARCHAR(100) UNIQUE,
    images JSONB,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_deal BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT FALSE,
    rating DECIMAL(2,1) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. CART & WISHLIST
-- ============================================

CREATE TABLE cart (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE TABLE wishlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- ============================================
-- 5. ORDERS & ORDER ITEMS
-- ============================================

CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50) CHECK (payment_method IN ('stripe', 'mpesa', 'cash', 'whatsapp')),
    
    -- Shipping
    shipping_address JSONB,
    billing_address JSONB,
    
    -- Payment
    stripe_payment_id VARCHAR(255),
    mpesa_transaction_id VARCHAR(255),
    
    -- Tracking
    tracking_number VARCHAR(255),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    
    -- Notes
    customer_notes TEXT,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    
    -- Product snapshot at time of order
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(500),
    product_sku VARCHAR(100),
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. REVIEWS & RATINGS
-- ============================================

CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images JSONB,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- ============================================
-- 7. COUPONS & DISCOUNTS
-- ============================================

CREATE TABLE coupons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE coupon_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(coupon_id, order_id)
);

-- ============================================
-- 8. ANALYTICS & TRACKING
-- ============================================

-- Page views tracking
CREATE TABLE page_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Product view analytics
CREATE TABLE product_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views_count INTEGER DEFAULT 0,
    cart_adds INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, date)
);

-- Daily sales analytics
CREATE TABLE sales_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    orders_count INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_discount DECIMAL(10,2) DEFAULT 0,
    total_delivery DECIMAL(10,2) DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 9. ADMIN ACTIVITY LOG
-- ============================================

CREATE TABLE admin_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 10. WHATSAPP INTEGRATION
-- ============================================

CREATE TABLE whatsapp_broadcasts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    target_audience VARCHAR(50) CHECK (target_audience IN ('all', 'active', 'vip')),
    total_sent INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE whatsapp_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    broadcast_id UUID REFERENCES whatsapp_broadcasts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 11. NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Products indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_rating ON products(rating);

-- Orders indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Order items indexes
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Cart indexes
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_cart_product ON cart(product_id);

-- Wishlist indexes
CREATE INDEX idx_wishlist_user ON wishlist(user_id);
CREATE INDEX idx_wishlist_product ON wishlist(product_id);

-- Reviews indexes
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Analytics indexes
CREATE INDEX idx_product_analytics_date ON product_analytics(date);
CREATE INDEX idx_sales_analytics_date ON sales_analytics(date);
CREATE INDEX idx_page_views_product ON page_views(product_id);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER FOR ORDER NUMBER GENERATION
-- ============================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================
-- TRIGGER FOR UPDATING PRODUCT RATING
-- ============================================

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET 
        rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE product_id = NEW.product_id AND is_approved = TRUE),
        reviews_count = (SELECT COUNT(*) FROM reviews WHERE product_id = NEW.product_id AND is_approved = TRUE)
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_rating_on_review AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Cart policies
CREATE POLICY "Users can view own cart" ON cart
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert to own cart" ON cart
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON cart
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own cart" ON cart
    FOR DELETE USING (auth.uid() = user_id);

-- Wishlist policies
CREATE POLICY "Users can view own wishlist" ON wishlist
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can insert to own wishlist" ON wishlist
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from own wishlist" ON wishlist
    FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin full access to order_items when viewing orders
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
        OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews" ON reviews
    FOR SELECT USING (is_approved = TRUE OR auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================

-- Get product with category
CREATE OR REPLACE FUNCTION get_product_with_category(product_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    price DECIMAL,
    category_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.price, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = product_uuid;
END;
$$ LANGUAGE plpgsql;

-- Get user stats
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_orders INTEGER,
    total_spent DECIMAL,
    wishlist_count INTEGER,
    cart_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM orders WHERE user_id = user_uuid) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = user_uuid AND payment_status = 'paid') as total_spent,
        (SELECT COUNT(*)::INTEGER FROM wishlist WHERE user_id = user_uuid) as wishlist_count,
        (SELECT COUNT(*)::INTEGER FROM cart WHERE user_id = user_uuid) as cart_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA SEEDING
-- ============================================

-- Insert default categories
INSERT INTO categories (name, slug, icon, color, description) VALUES
('Laptops', 'laptops', 'fa-laptop', '#2575fc', 'High-performance laptops and notebooks'),
('Audio', 'audio', 'fa-headphones', '#6a11cb', 'Headphones, speakers, and audio equipment'),
('Storage', 'storage', 'fa-hdd', '#ffc107', 'SSDs, HDDs, and external storage'),
('Phones', 'phones', 'fa-mobile-alt', '#28a745', 'Latest smartphones and accessories'),
('Cables', 'cables', 'fa-plug', '#17a2b8', 'Cables, adapters, and connectors');

-- Insert admin user (password: admin123 - MUST BE CHANGED IN PRODUCTION)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (name, email, password, role, email_verified) VALUES
('Admin User', 'admin@awesometech.co.ke', '$2a$10$YourHashedPasswordHere', 'admin', TRUE);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Daily sales report view
CREATE OR REPLACE VIEW daily_sales_report AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as orders_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value,
    SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Product performance view
CREATE OR REPLACE VIEW product_performance AS
SELECT 
    p.id,
    p.name,
    p.brand,
    c.name as category,
    p.price,
    p.stock,
    p.views_count,
    p.rating,
    p.reviews_count,
    (SELECT COUNT(*) FROM order_items WHERE product_id = p.id) as total_sold,
    (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE product_id = p.id) as total_revenue
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;

-- Customer lifetime value view
CREATE OR REPLACE VIEW customer_lifetime_value AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(o.total_amount) as lifetime_value,
    AVG(o.total_amount) as average_order_value,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.role = 'customer'
GROUP BY u.id, u.name, u.email;

-- ============================================
-- COMMENTS & DOCUMENTATION
-- ============================================

COMMENT ON TABLE users IS 'User accounts for customers and admins';
COMMENT ON TABLE products IS 'Product catalog with specifications and pricing';
COMMENT ON TABLE orders IS 'Customer orders with payment and shipping information';
COMMENT ON TABLE order_items IS 'Individual items within each order';
COMMENT ON TABLE reviews IS 'Product reviews and ratings from customers';
COMMENT ON TABLE categories IS 'Product categories for organization';
COMMENT ON TABLE cart IS 'Shopping cart items for logged-in users';
COMMENT ON TABLE wishlist IS 'User wishlists for saved products';
COMMENT ON TABLE admin_activity_log IS 'Audit log for admin actions';
COMMENT ON TABLE sales_analytics IS 'Daily aggregated sales metrics';

-- ============================================
-- END OF SCHEMA
-- ============================================
