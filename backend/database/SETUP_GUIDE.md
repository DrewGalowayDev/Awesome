# Supabase Database Setup Guide

## 📋 Overview

This guide will help you set up the complete database schema for Awesome Technologies e-commerce platform in Supabase.

## 🗄️ Database Tables Created

### Core Tables (15 Tables)
1. **users** - User accounts (customers & admins)
2. **addresses** - User shipping/billing addresses
3. **categories** - Product categories
4. **products** - Product catalog
5. **cart** - Shopping cart items
6. **wishlist** - User wishlists
7. **orders** - Customer orders
8. **order_items** - Order line items
9. **reviews** - Product reviews & ratings
10. **coupons** - Discount coupons
11. **coupon_usage** - Coupon redemption tracking
12. **page_views** - Page view analytics
13. **product_analytics** - Product performance metrics
14. **sales_analytics** - Daily sales reports
15. **admin_activity_log** - Admin action audit trail
16. **whatsapp_broadcasts** - WhatsApp marketing campaigns
17. **whatsapp_messages** - Individual WhatsApp messages
18. **notifications** - User notifications

## 🚀 Step-by-Step Setup

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Execute the Schema

1. Open the file: `backend/database/supabase-schema.sql`
2. Copy the **entire** SQL content
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for execution to complete (may take 30-60 seconds)

### Step 3: Verify Table Creation

1. Go to **Table Editor** in left sidebar
2. You should see all 18 tables listed
3. Click on each table to verify structure

### Step 4: Check Seed Data

The schema includes seed data:
- **5 Default Categories**: Laptops, Audio, Storage, Phones, Cables
- **1 Admin User**: admin@awesometech.co.ke

### Step 5: Update Admin Password

**CRITICAL SECURITY STEP:**

We have prepared a SQL script to create your admin user with these credentials:
- **Name:** `awesometech`
- **Email:** `admin@awesometech.co.ke`
- **Password:** `awesometech254`

1. Open the file `backend/database/create_admin_awesometech.sql`
2. Copy its entire content.
3. Go to **SQL Editor** in your Supabase dashboard.
4. Paste and run the script.

**Alternatively, run this query directly:**

```sql
-- Create Admin User 'awesometech'
INSERT INTO users (name, email, password, role, email_verified) 
VALUES (
    'awesometech', 
    'admin@awesometech.co.ke', 
    '$2a$10$jcGz8DaoDpOV8nK6lWbwu..f.shviTpkBlwxRIEXm7t8dPqEqYSHy', -- Hash for 'awesometech254'
    'admin', 
    TRUE
)
ON CONFLICT (email) DO UPDATE 
SET 
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    email_verified = EXCLUDED.email_verified;
```

## 🔐 Row Level Security (RLS)

The schema includes RLS policies for:
- ✅ Users can only view/edit their own data
- ✅ Cart/Wishlist restricted to owners
- ✅ Orders visible to owner or admin
- ✅ Reviews moderated by approval status
- ✅ Admins have full access

### Enable RLS on Additional Tables

If you add custom tables, enable RLS:

```sql
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON your_table
    FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
```

## 📊 Database Features

### 1. Auto-Generated Fields

**Order Numbers:**
- Automatically generated as `ORD-YYYYMMDD-00001`
- Sequential numbering per day

**Timestamps:**
- `created_at` set on insert
- `updated_at` auto-updates on changes

### 2. Triggers

**Product Rating Updates:**
- Automatically recalculates when reviews added/updated
- Updates `rating` and `reviews_count` fields

**Timestamp Updates:**
- Auto-updates `updated_at` on all main tables

### 3. Indexes

Performance indexes created on:
- Email lookups
- Product searches (brand, category, price)
- Order queries (status, user, date)
- Analytics queries (date-based)

### 4. Foreign Keys

All relationships properly defined:
- CASCADE deletes where appropriate
- SET NULL for soft references
- Prevents orphaned records

## 📈 Analytics & Reporting

### Pre-built Views

**1. Daily Sales Report:**
```sql
SELECT * FROM daily_sales_report 
ORDER BY date DESC 
LIMIT 30;
```

**2. Product Performance:**
```sql
SELECT * FROM product_performance 
ORDER BY total_revenue DESC 
LIMIT 10;
```

**3. Customer Lifetime Value:**
```sql
SELECT * FROM customer_lifetime_value 
ORDER BY lifetime_value DESC 
LIMIT 50;
```

### Custom Analytics Functions

**Get User Stats:**
```sql
SELECT * FROM get_user_stats('user-uuid-here');
```

**Get Product with Category:**
```sql
SELECT * FROM get_product_with_category('product-uuid-here');
```

## 🔍 Testing Your Setup

### 1. Test Category Creation

```sql
INSERT INTO categories (name, slug, icon, color)
VALUES ('Test Category', 'test-category', 'fa-box', '#FF5733');

SELECT * FROM categories WHERE slug = 'test-category';
```

### 2. Test Product Creation

```sql
INSERT INTO products (
    name, 
    slug, 
    description, 
    price, 
    brand, 
    stock,
    category_id
)
VALUES (
    'Test Product',
    'test-product',
    'This is a test product',
    9999.99,
    'Test Brand',
    10,
    (SELECT id FROM categories WHERE slug = 'laptops' LIMIT 1)
);

SELECT * FROM products WHERE slug = 'test-product';
```

### 3. Test Order Creation

```sql
-- First, create a test customer
INSERT INTO users (name, email, password, role)
VALUES ('Test Customer', 'customer@test.com', 'hashed-password', 'customer')
RETURNING id;

-- Create an order (order_number auto-generates)
INSERT INTO orders (
    user_id,
    total_amount,
    status,
    payment_status
)
VALUES (
    '<user-id-from-above>',
    9999.99,
    'pending',
    'pending'
)
RETURNING *;
```

## 🔧 Backend Configuration

### Update Supabase Config

In your `backend/.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

Get these from:
1. Supabase Dashboard → Settings → API
2. Copy URL and both keys

### Test Backend Connection

```bash
cd backend
npm run dev
```

Test API endpoint:
```bash
curl http://localhost:5000/health
```

## 📦 Data Migration (Optional)

If you have existing data, create migration scripts:

### Example: Import Products from CSV

```sql
-- Using Supabase SQL Editor
COPY products(name, slug, price, brand, stock, category_id)
FROM '/path/to/products.csv'
DELIMITER ','
CSV HEADER;
```

## 🎯 Common Operations

### Add New Admin User

```sql
INSERT INTO users (name, email, password, role, email_verified)
VALUES (
    'New Admin',
    'newadmin@awesometech.co.ke',
    '$2a$10$hashed-password-here',
    'admin',
    TRUE
);
```

### Bulk Update Product Prices

```sql
UPDATE products 
SET price = price * 0.9,  -- 10% discount
    old_price = price
WHERE category_id = (SELECT id FROM categories WHERE slug = 'laptops');
```

### Generate Daily Analytics

```sql
INSERT INTO sales_analytics (
    date,
    orders_count,
    total_revenue,
    new_customers
)
SELECT 
    CURRENT_DATE,
    COUNT(*) as orders_count,
    SUM(total_amount) as total_revenue,
    COUNT(DISTINCT CASE WHEN u.created_at::date = CURRENT_DATE THEN u.id END) as new_customers
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at::date = CURRENT_DATE;
```

## 🛡️ Security Best Practices

1. **Never commit .env files** to version control
2. **Use service role key** only in backend
3. **Use anon key** in frontend
4. **Enable RLS** on all new tables
5. **Rotate keys regularly** in production
6. **Use prepared statements** to prevent SQL injection
7. **Validate input** on backend before database operations

## 📱 Real-Time Features

Supabase supports real-time subscriptions. Enable for tables:

```sql
-- Enable real-time for orders (admin dashboard)
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
```

Then in your frontend:
```javascript
const subscription = supabase
    .from('orders')
    .on('INSERT', payload => {
        console.log('New order!', payload);
        // Update admin dashboard
    })
    .subscribe();
```

## 🔄 Backup & Maintenance

### Automated Backups

Supabase provides daily backups. For additional security:

1. Go to Settings → Database
2. Click "Restore" to see backup points
3. Enable Point-in-Time Recovery (paid plans)

### Manual Backup

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or using pg_dump
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
```

## 📞 Support

If you encounter issues:

1. Check Supabase Logs: Dashboard → Logs
2. Verify connection: Test with SQL query
3. Check RLS policies: May block legitimate queries
4. Review foreign key constraints

## ✅ Verification Checklist

- [ ] All 18 tables created successfully
- [ ] Indexes created (check Table Editor)
- [ ] Default categories inserted (5 rows)
- [ ] Admin user created and password set
- [ ] RLS policies enabled
- [ ] Triggers working (test with insert)
- [ ] Backend .env configured
- [ ] Backend can connect to Supabase
- [ ] Test queries execute successfully

## 🎉 Next Steps

Your database is now ready! You can:

1. Start the backend server: `npm run dev`
2. Test API endpoints
3. Open admin dashboard: `admin-dashboard.html`
4. Add products via admin panel
5. Test order flow
6. Set up analytics tracking

---

**Schema Version:** 1.0.0  
**Last Updated:** 2025-11-29  
**Total Tables:** 18  
**Total Indexes:** 20+  
**Total Views:** 3  
**Total Functions:** 2
