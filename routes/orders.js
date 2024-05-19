var express = require('express');
var { createClient } = require('@supabase/supabase-js');
var router = express.Router();
var env = require("dotenv");

env.config();

const supabaseUrl = 'https://cihwtaciqnlnxxjygbht.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     description: Retrieve a list of all orders along with their carts and users
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: Bearer {token}
 *     responses:
 *       200:
 *         description: A list of orders with their carts and users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .select('*, carts:carts(*), users:users(*)')

        if (orderError) {
            console.error(orderError);
            return res.status(500).send({ error: 'Failed to retrieve orders.' });
        }

        if (!orders) {
            return res.status(404).send({ error: 'Orders not found.' });
        }

        res.status(200).send(orders);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     description: Retrieve a specific order by ID along with its cart items and products
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: Bearer {token}
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The order ID
 *     responses:
 *       200:
 *         description: A specific order with its cart items and products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', verifyToken, async (req, res) => {
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

        res.status(200).send(orderWithItems);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order for a user based on their cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: Bearer {token}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - cart_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: 123
 *               cart_id:
 *                 type: string
 *                 example: 456
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required fields; user_id and cart_id
 *       500:
 *         description: Internal server error
 */
router.post('/', verifyToken, async (req, res) => {
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

        res.status(201).send({ message: 'Order placed successfully.', data: order });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

module.exports = router;
