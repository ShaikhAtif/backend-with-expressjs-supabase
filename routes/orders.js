var express = require('express');
var { createClient } = require('@supabase/supabase-js');
var router = express.Router();
var env = require("dotenv");

env.config();

const supabaseUrl = 'https://cihwtaciqnlnxxjygbht.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

router.get('/', async (req, res) => {
    try {
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('*, carts:carts(*), users:users(*)')

        if (orderError) {
            console.error(orderError);
            return res.status(500).send({ error: 'Failed to retrieve cart.' });
        }

        if (!orders) {
            return res.status(404).send({ error: 'Cart not found.' });
        }

        res.send(orders);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, carts:carts(*), users:users(*)') // Join with carts and users
            .eq('id', id)
            .single();

        if (orderError) {
            console.error(orderError);
            return res.status(500).send({ error: 'Failed to retrieve order.' });
        }

        if (!order) {
            return res.status(404).send({ error: 'Order not found.' });
        }

        // Get cart items for the order
        const { data: cartItems, error: cartItemsError } = await supabase
            .from('cart_items')
            .select('*, products:products(*)') // Join with products
            .eq('cart_id', order.cart_id);

        if (cartItemsError) {
            console.error(cartItemsError);
            return res.status(500).send({ error: 'Failed to retrieve cart items.' });
        }

        // Combine order details with cart items
        const orderWithItems = {
            ...order,
            cart_items: cartItems,
        };

        res.send(orderWithItems);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

router.post('/', async (req, res) => {
    const { user_id, cart_id } = req.body;

    if (!user_id || !cart_id) {
        return res.status(400).send({ error: 'Missing required fields: user_id and cart_id.' });
    }

    try {
        // Get cart details
        const { data: cart, error: cartError } = await supabase
            .from('carts')
            .select()
            .eq('id', cart_id)
            .single();

        if (cartError) {
            console.error(cartError);
            return res.status(500).send({ error: 'Failed to retrieve cart.' });
        }

        if (!cart) {
            return res.status(404).send({ error: 'Cart not found.' });
        }

        // Get cart items
        const { data: cartItems, error: cartItemsError } = await supabase
            .from('cart_items')
            .select('*, product:products(*)') // Join with products
            .eq('cart_id', cart_id);

        if (cartItemsError) {
            console.error(cartItemsError);
            return res.status(500).send({ error: 'Failed to retrieve cart items.' });
        }

        // Calculate total cost
        const total_cost = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({ user_id, cart_id, total_cost })
            .select();

        if (orderError) {
            console.error(orderError);
            return res.status(500).send({ error: 'Failed to create order.' });
        }

        res.send({ message: 'Order placed successfully.', data: order });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

module.exports = router;
