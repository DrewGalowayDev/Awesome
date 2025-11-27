const { supabase } = require('../config/supabase');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
    try {
        const { data: cartItems, error } = await supabase
            .from('cart')
            .select('*, products(*)')
            .eq('user_id', req.user.id);

        if (error) throw error;

        // Calculate total
        const total = cartItems.reduce((sum, item) => {
            return sum + (item.products.price * item.quantity);
        }, 0);

        res.status(200).json({
            success: true,
            count: cartItems.length,
            total,
            cartItems
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = async (req, res, next) => {
    try {
        const { product_id, quantity = 1 } = req.body;

        // Check if item already exists in cart
        const { data: existing } = await supabase
            .from('cart')
            .select('*')
            .eq('user_id', req.user.id)
            .eq('product_id', product_id)
            .single();

        if (existing) {
            // Update quantity
            const { data: updated, error } = await supabase
                .from('cart')
                .update({ quantity: existing.quantity + quantity })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;

            return res.status(200).json({
                success: true,
                message: 'Cart updated successfully',
                cartItem: updated
            });
        }

        // Add new item
        const { data: cartItem, error } = await supabase
            .from('cart')
            .insert([{
                user_id: req.user.id,
                product_id,
                quantity
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Item added to cart',
            cartItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update cart item
// @route   PUT /api/cart/update/:itemId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;

        const { data: cartItem, error } = await supabase
            .from('cart')
            .update({ quantity })
            .eq('id', req.params.itemId)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Cart item updated',
            cartItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('cart')
            .delete()
            .eq('id', req.params.itemId)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Item removed from cart'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('cart')
            .delete()
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Cart cleared'
        });
    } catch (error) {
        next(error);
    }
};
