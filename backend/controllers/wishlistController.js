const { supabase } = require('../config/supabase');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
    try {
        const { data: wishlist, error } = await supabase
            .from('wishlist')
            .select('*, products(*)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            count: wishlist.length,
            wishlist
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add to wishlist
// @route   POST /api/wishlist/add
// @access  Private
exports.addToWishlist = async (req, res, next) => {
    try {
        const { product_id } = req.body;

        // Check if already in wishlist
        const { data: existing } = await supabase
            .from('wishlist')
            .select('id')
            .eq('user_id', req.user.id)
            .eq('product_id', product_id)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Product already in wishlist'
            });
        }

        const { data: wishlistItem, error } = await supabase
            .from('wishlist')
            .insert([{
                user_id: req.user.id,
                product_id
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Added to wishlist',
            wishlistItem
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/remove/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', req.user.id)
            .eq('product_id', req.params.productId);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Removed from wishlist'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Clear wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private
exports.clearWishlist = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Wishlist cleared'
        });
    } catch (error) {
        next(error);
    }
};
