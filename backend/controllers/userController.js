const { supabase, supabaseAdmin } = require('../config/supabase');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, phone, role, created_at')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        // Get addresses
        const { data: addresses } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', req.user.id);

        res.status(200).json({
            success: true,
            user: {
                ...user,
                addresses
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const { name, phone } = req.body;

        const { data: user, error } = await supabase
            .from('users')
            .update({ name, phone })
            .eq('id', req.user.id)
            .select('id, name, email, phone, role')
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Profile updated',
            user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add address
// @route   POST /api/users/address
// @access  Private
exports.addAddress = async (req, res, next) => {
    try {
        const addressData = {
            ...req.body,
            user_id: req.user.id
        };

        const { data: address, error } = await supabase
            .from('addresses')
            .insert([addressData])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Address added',
            address
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update address
// @route   PUT /api/users/address/:id
// @access  Private
exports.updateAddress = async (req, res, next) => {
    try {
        const { data: address, error } = await supabase
            .from('addresses')
            .update(req.body)
            .eq('id', req.params.id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Address updated',
            address
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete address
// @route   DELETE /api/users/address/:id
// @access  Private
exports.deleteAddress = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('addresses')
            .delete()
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'Address deleted'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users (Admin)
// @route   GET /api/users/admin/all
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const client = supabaseAdmin || supabase;
        const { data: users, error } = await client
            .from('users')
            .select('id, name, email, phone, role, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user by ID (Admin)
// @route   GET /api/users/admin/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, phone, role, created_at')
            .eq('id', req.params.id)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user (Admin)
// @route   PUT /api/users/admin/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .update(req.body)
            .eq('id', req.params.id)
            .select('id, name, email, phone, role')
            .single();

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'User updated',
            user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/users/admin/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.status(200).json({
            success: true,
            message: 'User deleted'
        });
    } catch (error) {
        next(error);
    }
};
