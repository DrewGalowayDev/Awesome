const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../config/supabase');

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
exports.createPaymentIntent = async (req, res, next) => {
    try {
        const { amount, currency = 'kes' } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency,
            metadata: {
                user_id: req.user.id
            }
        });

        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
exports.confirmPayment = async (req, res, next) => {
    try {
        const { payment_intent_id, order_id } = req.body;

        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

        if (paymentIntent.status === 'succeeded') {
            // Update order payment status
            await supabase
                .from('orders')
                .update({ payment_status: 'paid' })
                .eq('id', order_id);

            res.status(200).json({
                success: true,
                message: 'Payment confirmed'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Payment not completed'
            });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Private
exports.getPaymentMethods = async (req, res, next) => {
    try {
        // TODO: Implement payment methods retrieval from Stripe
        res.status(200).json({
            success: true,
            methods: []
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add payment method
// @route   POST /api/payments/methods
// @access  Private
exports.addPaymentMethod = async (req, res, next) => {
    try {
        // TODO: Implement add payment method
        res.status(201).json({
            success: true,
            message: 'Payment method added'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete payment method
// @route   DELETE /api/payments/methods/:id
// @access  Private
exports.deletePaymentMethod = async (req, res, next) => {
    try {
        // TODO: Implement delete payment method
        res.status(200).json({
            success: true,
            message: 'Payment method deleted'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Handle Stripe webhook
// @route   POST /api/payments/webhook
// @access  Public
exports.handleWebhook = async (req, res, next) => {
    try {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                // Handle successful payment
                console.log('PaymentIntent was successful!');
                break;
            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                // Handle failed payment
                console.log('Payment failed!');
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        next(error);
    }
};
