# Database Schema Documentation

## Entity Relationship Diagram (ERD)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   USERS     │────────▶│   ORDERS     │────────▶│ ORDER_ITEMS │
│             │         │              │         │             │
│ - id (PK)   │         │ - id (PK)    │         │ - id (PK)   │
│ - email     │         │ - user_id(FK)│         │ - order_id  │
│ - role      │         │ - total      │         │ - product_id│
└─────────────┘         │ - status     │         │ - quantity  │
      │                 └──────────────┘         └─────────────┘
      │                        │                         │
      │                        │                         │
      ▼                        ▼                         ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  ADDRESSES  │         │   PAYMENTS   │         │  PRODUCTS   │
│             │         │              │         │             │
│ - user_id   │         │ - order_id   │         │ - id (PK)   │
│ - address   │         │ - amount     │         │ - name      │
└─────────────┘         └──────────────┘         │ - price     │
                                                  │ - stock     │
┌─────────────┐                                   └─────────────┘
│    CART     │────────────────────────────────▶        │
│             │                                          │
│ - user_id   │                                          │
│ - product_id│                                          │
└─────────────┘                                          │
                                                         │
┌─────────────┐                                          │
│  WISHLIST   │─────────────────────────────────────────┤
│             │                                          │
│ - user_id   │                                          │
│ - product_id│                                          │
└─────────────┘                                          │
                                                         │
┌─────────────┐                                          │
│   REVIEWS   │─────────────────────────────────────────┤
│             │                                          │
│ - user_id   │                                          │
│ - product_id│                                          │
│ - rating    │                                          │
└─────────────┘                                          │
                                                         │
┌─────────────┐                                          │
│ CATEGORIES  │◀─────────────────────────────────────────┘
│             │
│ - id (PK)   │
│ - name      │
└─────────────┘
```

## Table Descriptions

### 1. users
**Purpose:** Store customer and admin accounts

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | User's full name |
| email | VARCHAR(255) | Unique email address |
| password | VARCHAR(255) | Bcrypt hashed password |
| phone | VARCHAR(20) | Contact phone number |
| role | VARCHAR(20) | 'customer' or 'admin' |
| email_verified | BOOLEAN | Email verification status |
| created_at | TIMESTAMP | Account creation time |

**Indexes:**
- `idx_users_email` on email
- `idx_users_role` on role

**RLS Policies:** Users can view/edit own data; admins can view all

---

### 2. products
**Purpose:** Product catalog with specs and pricing

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Product name |
| slug | VARCHAR(255) | URL-friendly identifier |
| description | TEXT | Full description |
| specifications | JSONB | Technical specs |
| price | DECIMAL(10,2) | Current price (KSh) |
| old_price | DECIMAL(10,2) | Original price for discounts |
| brand | VARCHAR(100) | Manufacturer brand |
| condition | VARCHAR(50) | 'new' or 'refurbished' |
| stock | INTEGER | Available quantity |
| images | JSONB | Image URLs array |
| category_id | UUID | Foreign key to categories |
| is_featured | BOOLEAN | Show on homepage |
| rating | DECIMAL(2,1) | Average rating (1-5) |
| reviews_count | INTEGER | Total reviews |

**Indexes:**
- `idx_products_category` on category_id
- `idx_products_brand` on brand
- `idx_products_slug` on slug
- `idx_products_price` on price

**Triggers:**
- Auto-update rating when reviews change

---

### 3. orders
**Purpose:** Customer purchase orders

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Customer reference |
| order_number | VARCHAR(50) | Unique order ID (auto-generated) |
| subtotal | DECIMAL(10,2) | Items total |
| discount | DECIMAL(10,2) | Discount amount |
| delivery_fee | DECIMAL(10,2) | Shipping cost |
| total_amount | DECIMAL(10,2) | Final total |
| status | VARCHAR(50) | Order status (pending/processing/shipped/delivered/cancelled) |
| payment_status | VARCHAR(50) | Payment status (pending/paid/failed/refunded) |
| payment_method | VARCHAR(50) | Payment type (stripe/mpesa/cash/whatsapp) |
| shipping_address | JSONB | Delivery address |
| created_at | TIMESTAMP | Order placement time |

**Indexes:**
- `idx_orders_user` on user_id
- `idx_orders_number` on order_number
- `idx_orders_status` on status

**Triggers:**
- Auto-generate order_number on insert

---

### 4. order_items
**Purpose:** Individual products in each order

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_id | UUID | Parent order reference |
| product_id | UUID | Product reference (nullable) |
| product_name | VARCHAR(255) | Product name snapshot |
| product_image | VARCHAR(500) | Image snapshot |
| price | DECIMAL(10,2) | Price at time of order |
| quantity | INTEGER | Quantity ordered |
| subtotal | DECIMAL(10,2) | Line total (price × quantity) |

---

### 5. reviews
**Purpose:** Product ratings and customer feedback

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | Product reference |
| user_id | UUID | Reviewer reference |
| order_id | UUID | Related order (optional) |
| rating | INTEGER | 1-5 stars |
| title | VARCHAR(255) | Review headline |
| comment | TEXT | Detailed feedback |
| is_verified_purchase | BOOLEAN | From actual purchase |
| is_approved | BOOLEAN | Moderation status |

**Constraints:**
- One review per user per product
- Rating must be 1-5

**Triggers:**
- Updates product.rating on insert/update

---

### 6. cart
**Purpose:** Shopping cart for logged-in users

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Cart owner |
| product_id | UUID | Product reference |
| quantity | INTEGER | Item quantity |

**Constraints:**
- Unique (user_id, product_id) - prevents duplicates
- Quantity must be > 0

**RLS Policies:** Users can only access own cart

---

### 7. categories
**Purpose:** Product categorization and organization

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Category name |
| slug | VARCHAR(255) | URL identifier |
| icon | VARCHAR(100) | FontAwesome icon class |
| color | VARCHAR(50) | Hex color code |
| parent_id | UUID | Parent category (hierarchical) |
| sort_order | INTEGER | Display order |

**Features:**
- Supports nested categories
- Custom icons and colors
- Sortable order

---

### 8. sales_analytics
**Purpose:** Daily sales aggregation for reporting

| Column | Type | Description |
|--------|------|-------------|
| date | DATE | Business date |
| orders_count | INTEGER | Total orders |
| total_revenue | DECIMAL(10,2) | Total sales |
| total_discount | DECIMAL(10,2) | Total discounts |
| new_customers | INTEGER | First-time buyers |
| returning_customers | INTEGER | Repeat buyers |

**Usage:**
- Populate via scheduled job or trigger
- Used for admin dashboard charts
- One row per day

---

### 9. admin_activity_log
**Purpose:** audit trail for admin actions

| Column | Type | Description |
|--------|------|-------------|
| admin_id | UUID | Admin who performed action |
| action | VARCHAR(100) | Action type (create/update/delete) |
| entity_type | VARCHAR(50) | Table affected (product/order/user) |
| entity_id | UUID | Record ID affected |
| details | JSONB | Additional context |
| ip_address | INET | Admin's IP |
| created_at | TIMESTAMP | When action occurred |

**Usage:**
- Track all admin changes
- Compliance and security
- Debugging and accountability

---

### 10. whatsapp_broadcasts
**Purpose:** WhatsApp marketing campaign tracking

| Column | Type | Description |
|--------|------|-------------|
| admin_id | UUID | Campaign creator |
| message | TEXT | Message content |
| target_audience | VARCHAR(50) | Recipient group (all/active/vip) |
| total_sent | INTEGER | Messages delivered |
| status | VARCHAR(50) | Campaign status |

---

## Special Features

### 1. JSONB Columns

**products.specifications:**
```json
{
  "processor": "Intel Core i7",
  "ram": "16GB DDR4",
  "storage": "512GB SSD",
  "display": "15.6 inch FHD"
}
```

**products.images:**
```json
[
  "https://cdn.example.com/product-1.jpg",
  "https://cdn.example.com/product-2.jpg"
]
```

**orders.shipping_address:**
```json
{
  "full_name": "John Doe",
  "phone": "+254 712 345 678",
  "address_line1": "123 Main Street",
  "city": "Nairobi",
  "postal_code": "00100"
}
```

### 2. Check Constraints

```sql
-- Role must be customer or admin
role CHECK (role IN ('customer', 'admin'))

-- Rating must be 1-5
rating CHECK (rating >= 1 AND rating <= 5)

-- Quantity must be positive
quantity CHECK (quantity > 0)
```

### 3. Unique Constraints

```sql
-- Prevent duplicate cart items
UNIQUE(user_id, product_id) ON cart

-- Prevent duplicate reviews
UNIQUE(user_id, product_id) ON reviews

-- Unique email
UNIQUE(email) ON users
```

## Data Flow Examples

### Order Creation Flow

```
1. User adds items to CART
   INSERT INTO cart (user_id, product_id, quantity)

2. User proceeds to checkout
   SELECT * FROM cart WHERE user_id = ?

3. Create ORDER
   INSERT INTO orders (user_id, total_amount, ...)
   
4. Create ORDER_ITEMS from CART
   INSERT INTO order_items (order_id, product_id, ...)
   SELECT FROM cart WHERE user_id = ?

5. Clear CART
   DELETE FROM cart WHERE user_id = ?

6. Update PRODUCT stock
   UPDATE products SET stock = stock - quantity
   WHERE id IN (cart items)
```

### Review Submission Flow

```
1. Customer submits review
   INSERT INTO reviews (product_id, user_id, rating, comment)

2. Trigger updates product rating
   UPDATE products 
   SET rating = AVG(reviews.rating),
       reviews_count = COUNT(*)
   WHERE id = product_id
```

## Performance Optimization

### Recommended Indexes (Already Created)

```sql
-- Fast user lookups
CREATE INDEX idx_users_email ON users(email);

-- Product searches
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_price ON products(price);

-- Order queries
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### Query Optimization Tips

1. **Use pagination** for large result sets
2. **Select specific columns** instead of SELECT *
3. **Use indexes** in WHERE clauses
4. **Avoid N+1 queries** - use JOINs
5. **Cache frequently accessed data** (categories, featured products)

## Maintenance Tasks

### Daily
- [ ] Check for low stock products
- [ ] Review new product reviews
- [ ] Process pending orders
- [ ] Update analytics tables

### Weekly
- [ ] Backup database
- [ ] Review slow queries
- [ ] Clean up old cart items
- [ ] Archive old order records

### Monthly
- [ ] Analyze database size
- [ ] Optimize indexes
- [ ] Review RLS policies
- [ ] Update statistics

---

**Schema Version:** 1.0.0  
**Database:** PostgreSQL (Supabase)  
**Total Tables:** 18  
**Total Relationships:** 25+
