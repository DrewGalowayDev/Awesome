# Awesome Technologies Backend API

Complete Node.js + Express + Supabase backend for the Awesome Technologies e-commerce platform.

## 🚀 Features

- **Authentication & Authorization**
  - User registration and login with JWT
  - Password hashing with bcrypt
  - Role-based access control (Customer/Admin)
  - Password reset functionality
  - Email verification

- **Product Management**
  - CRUD operations for products
  - Advanced search and filtering
  - Filter by price range, brand, condition
  - Featured products and deals
  - Category-based organization

- **Shopping Cart**
  - Add/remove items
  - Update quantities
  - Persistent cart storage

- **Order Management**
  - Place orders
  - Order history
  - Order status tracking
  - Admin order management

- **User Features**
  - User profiles
  - Wishlist
  - Multiple addresses
  - Payment methods
  - Product reviews

- **Payment Integration**
  - Stripe payment gateway
  - Secure payment processing
  - Webhook handling

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase account
- Stripe account (for payments)

## 🛠️ Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   copy .env.example .env
   ```

4. **Configure your `.env` file:**
   - Add your Supabase credentials
   - Add JWT secret
   - Add Stripe keys
   - Add email configuration

5. **Set up Supabase database:**
   
   Run the following SQL in your Supabase SQL editor:

   ```sql
   -- Users table
   CREATE TABLE users (
       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       email VARCHAR(255) UNIQUE NOT NULL,
       password VARCHAR(255) NOT NULL,
       phone VARCHAR(20),
       role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Categories table
   CREATE TABLE categories (
       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
       name VARCHAR(255) NOT NULL,
       slug VARCHAR(255) UNIQUE NOT NULL,
       description TEXT,
       image VARCHAR(500),
       created_at TIMESTAMP DEFAULT NOW()
   );

   -- Products table
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
       images JSONB,
       category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
       is_featured BOOLEAN DEFAULT FALSE,
       rating DECIMAL(2,1) DEFAULT 0,
       reviews_count INTEGER DEFAULT 0,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Cart table
   CREATE TABLE cart (
       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       product_id UUID REFERENCES products(id) ON DELETE CASCADE,
       quantity INTEGER DEFAULT 1,
       created_at TIMESTAMP DEFAULT NOW(),
       UNIQUE(user_id, product_id)
   );

   -- Wishlist table
   CREATE TABLE wishlist (
       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       product_id UUID REFERENCES products(id) ON DELETE CASCADE,
       created_at TIMESTAMP DEFAULT NOW(),
       UNIQUE(user_id, product_id)
   );

   -- Orders table
   CREATE TABLE orders (
       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       order_number VARCHAR(50) UNIQUE NOT NULL,
       total_amount DECIMAL(10,2) NOT NULL,
       status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
       payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
       payment_method VARCHAR(50),
       shipping_address JSONB,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Order items table
   CREATE TABLE order_items (
       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
       order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
       product_id UUID REFERENCES products(id),
       quantity INTEGER NOT NULL,
       price DECIMAL(10,2) NOT NULL,
       created_at TIMESTAMP DEFAULT NOW()
   );

   -- Reviews table
   CREATE TABLE reviews (
       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       product_id UUID REFERENCES products(id) ON DELETE CASCADE,
       rating INTEGER CHECK (rating >= 1 AND rating <= 5),
       comment TEXT,
       created_at TIMESTAMP DEFAULT NOW(),
       UNIQUE(user_id, product_id)
   );

   -- Addresses table
   CREATE TABLE addresses (
       id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       full_name VARCHAR(255),
       phone VARCHAR(20),
       address_line1 VARCHAR(255) NOT NULL,
       address_line2 VARCHAR(255),
       city VARCHAR(100) NOT NULL,
       county VARCHAR(100),
       postal_code VARCHAR(20),
       is_default BOOLEAN DEFAULT FALSE,
       created_at TIMESTAMP DEFAULT NOW()
   );

   -- Create indexes
   CREATE INDEX idx_products_category ON products(category_id);
   CREATE INDEX idx_products_brand ON products(brand);
   CREATE INDEX idx_cart_user ON cart(user_id);
   CREATE INDEX idx_orders_user ON orders(user_id);
   CREATE INDEX idx_reviews_product ON reviews(product_id);
   ```

6. **Start the server:**
   
   Development mode:
   ```bash
   npm run dev
   ```

   Production mode:
   ```bash
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/update-profile` - Update user profile
- `PUT /api/auth/update-password` - Update password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Products
- `GET /api/products` - Get all products (with pagination)
- `GET /api/products/search?q=keyword` - Search products
- `GET /api/products/filter` - Filter products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:categoryId` - Get products by category
- `GET /api/products/brand/:brand` - Get products by brand
- `GET /api/products/featured` - Get featured products
- `GET /api/products/deals` - Get deal products
- `GET /api/products/new-arrivals` - Get new arrivals
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:itemId` - Update cart item
- `DELETE /api/cart/remove/:itemId` - Remove from cart
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/admin/all` - Get all orders (Admin)
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Wishlist
- `GET /api/wishlist` - Get user wishlist
- `POST /api/wishlist/add` - Add to wishlist
- `DELETE /api/wishlist/remove/:productId` - Remove from wishlist

### Reviews
- `GET /api/reviews/product/:productId` - Get product reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/methods` - Get payment methods
- `POST /api/payments/methods` - Add payment method

## 🔐 Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 📱 WhatsApp Integration

For product inquiries, use the configured WhatsApp business number: **+254 704546916**

Format: `https://wa.me/254704546916?text=I'm interested in [Product Name]`

## 🚨 Error Handling

All errors return JSON in this format:
```json
{
  "success": false,
  "message": "Error message here"
}
```

## 🧪 Testing

Run tests:
```bash
npm test
```

## 📦 Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure production database
3. Set secure JWT_SECRET
4. Configure CORS for production domain
5. Deploy to your preferred platform (Heroku, AWS, DigitalOcean, etc.)

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port | No (default: 5000) |
| NODE_ENV | Environment | Yes |
| SUPABASE_URL | Supabase project URL | Yes |
| SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| SUPABASE_SERVICE_KEY | Supabase service role key | Yes |
| JWT_SECRET | JWT secret key | Yes |
| JWT_EXPIRE | JWT expiration time | No (default: 7d) |
| STRIPE_SECRET_KEY | Stripe secret key | Yes |
| FRONTEND_URL | Frontend URL for CORS | Yes |

## 📄 License

MIT

## 👨‍💻 Author

Awesome Technologies Team

## 📞 Support

For support, email: support@awesometech.co.ke
Phone: +254 704546916
