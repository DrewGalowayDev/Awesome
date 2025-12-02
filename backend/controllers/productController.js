const { supabase } = require('../config/supabase');

// @desc    Get all products with filters
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res, next) => {
    try {
        // Parse limit with higher default to show all products
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000; // Increased default limit
        const sort = req.query.sort || 'created_at';
        const order = req.query.order || 'desc';
        
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('products')
            .select('*, categories(*)', { count: 'exact' })
            .range(from, to)
            .order(sort, { ascending: order === 'asc' });

        const { data: products, error, count } = await query;

        if (error) throw error;

        res.status(200).json({
            success: true,
            count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit),
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Search products
// @route   GET /api/products/search?q=keyword
// @access  Public
exports.searchProducts = async (req, res, next) => {
    try {
        const { q } = req.query;

        const { data: products, error } = await supabase
            .from('products')
            .select('*, categories(*)')
            .or(`name.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`);

        if (error) throw error;

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Filter products
// @route   GET /api/products/filter
// @access  Public
exports.filterProducts = async (req, res, next) => {
    try {
        const { 
            minPrice, 
            maxPrice, 
            brand, 
            condition, 
            category,
            inStock 
        } = req.query;

        let query = supabase
            .from('products')
            .select('*, categories(*)');

        if (minPrice) query = query.gte('price', minPrice);
        if (maxPrice) query = query.lte('price', maxPrice);
        if (brand) query = query.eq('brand', brand);
        if (condition) query = query.eq('condition', condition);
        if (category) query = query.eq('category_id', category);
        if (inStock) query = query.gt('stock', 0);

        const { data: products, error } = await query;

        if (error) throw error;

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*, categories(*), reviews(*)')
            .eq('id', req.params.id)
            .single();

        if (error || !product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            product
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
exports.getProductsByCategory = async (req, res, next) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*, categories(*)')
            .eq('category_id', req.params.categoryId);

        if (error) throw error;

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get products by brand
// @route   GET /api/products/brand/:brand
// @access  Public
exports.getProductsByBrand = async (req, res, next) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*, categories(*)')
            .eq('brand', req.params.brand);

        if (error) throw error;

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*, categories(*)')
            .eq('is_featured', true)
            .limit(8);

        if (error) throw error;

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get deal products
// @route   GET /api/products/deals
// @access  Public
exports.getDealsProducts = async (req, res, next) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*, categories(*)')
            .not('old_price', 'is', null)
            .limit(8);

        if (error) throw error;

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
exports.getNewArrivals = async (req, res, next) => {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*, categories(*)')
            .order('created_at', { ascending: false })
            .limit(8);

        if (error) throw error;

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
    try {
        const productData = req.body;

        const { data: product, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .update(req.body)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product stock (Admin)
// @route   PUT /api/products/:id/stock
// @access  Private/Admin
exports.updateStock = async (req, res, next) => {
    try {
        const { stock } = req.body;

        const { data: product, error } = await supabase
            .from('products')
            .update({ stock })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Stock updated successfully',
            product
        });
    } catch (error) {
        next(error);
    }
};
