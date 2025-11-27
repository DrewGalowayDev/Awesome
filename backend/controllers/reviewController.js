const { supabase } = require('../config/supabase');

// @desc    Get product reviews
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res, next) => {
    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select('*, users(name)')
            .eq('product_id', req.params.productId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
    try {
        const { product_id, rating, comment } = req.body;

        const { data: review, error } = await supabase
            .from('reviews')
            .insert([{
                user_id: req.user.id,
                product_id,
                rating,
                comment
            }])
            .select()
            .single();

        if (error) throw error;

        // Update product rating
        const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('product_id', product_id);

        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await supabase
            .from('products')
            .update({
                rating: avgRating.toFixed(1),
                reviews_count: reviews.length
            })
            .eq('id', product_id);

        res.status(201).json({
            success: true,
            message: 'Review added',
            review
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;

        const { data: review, error } = await supabase
            .from('reviews')
            .update({ rating, comment })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Review updated',
            review
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Review deleted'
        });
    } catch (error) {
        next(error);
    }
};
