var express = require('express');
var { createClient } = require('@supabase/supabase-js');
var router = express.Router();
var env = require("dotenv");
const verifyToken = require('../middlewares/authMiddleware');

env.config();

const supabaseUrl = 'https://cihwtaciqnlnxxjygbht.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * @swagger
 * /carts:
 *   get:
 *     summary: Get all carts
 *     description: Retrieve a list of all carts along with their items
 *     tags: [Carts]
 *     security:
 *       - Bearer Token: Bearer {token}
 *     responses:
 *       200:
 *         description: A list of carts with their items
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
        const { data: cart, error: cartError } = await supabase
            .from('carts')
            .select('*, cart_items:cart_items(*)')

        if (cartError) {
            console.error(cartError);
            return res.status(500).send({ error: 'Failed to retrieve cart.' });
        }

        if (!cart) {
            return res.status(404).send({ error: 'Cart not found.' });
        }

        res.status(200).send(cart);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /carts/{id}:
 *   get:
 *     summary: Get a cart by ID
 *     description: Retrieve a specific cart by ID along with its items
 *     tags: [Carts]
 *     security:
 *       - Bearer Token: Bearer {token}
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The cart ID
 *     responses:
 *       200:
 *         description: A specific cart with its items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const { data: cart, error: cartError } = await supabase
            .from('carts')
            .select('*, cart_items:cart_items(*)')
            .eq('id', id)
            .single();

        if (cartError) {
            console.error(cartError);
            return res.status(500).send({ error: 'Failed to retrieve cart.' });
        }

        if (!cart) {
            return res.status(404).send({ error: 'Cart not found.' });
        }

        res.status(200).send(cart);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /carts:
 *   post:
 *     summary: Create a new cart
 *     description: Create a new cart for a user
 *     tags: [Carts]
 *     security:
 *       - Bearer Token: Bearer {token}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: string
 *                 example: 123
 *     responses:
 *       201:
 *         description: Cart created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required field; {user_id}
 *       500:
 *         description: Internal server error
 */
router.post('/', verifyToken, async (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).send({ error: 'Missing required field: user_id.' });
    }

    try {
        const { data: cart, error } = await supabase
            .from('carts')
            .insert({ user_id })
            .select();

        if (error) {
            console.error(error);
            return res.status(500).send({ error: 'Failed to create cart.' });
        }

        res.status(201).send({ message: 'Cart created successfully.', data: cart });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /carts/{id}/items:
 *   post:
 *     summary: Add item to cart
 *     description: Add a new item to a specific cart
 *     tags: [Carts]
 *     security:
 *       - Bearer Token: Bearer {token}
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The cart ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: string
 *                 example: 456
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required fields; product_id and quantity
 *       500:
 *         description: Internal server error
 */
router.post('/:id/items', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
        return res.status(400).send({ error: 'Missing required fields: product_id and quantity.' });
    }

    try {
        const { data: cartItem, error } = await supabase
            .from('cart_items')
            .insert({ cart_id: id, product_id, quantity })
            .select();

        if (error) {
            console.error(error);
            return res.status(500).send({ error: 'Failed to add item to cart.' });
        }

        res.status(201).send({ message: 'Item added to cart successfully.', data: cartItem });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /carts/{id}/items/{item_id}:
 *   put:
 *     summary: Update item quantity in cart
 *     description: Update the quantity of an item in a specific cart
 *     tags: [Carts]
 *     security:
 *       - Bearer Token: Bearer {token}
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The cart ID
 *       - in: path
 *         name: item_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 5
 *     responses:
 *       200:
 *         description: Item quantity updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required field; quantity
 *       500:
 *         description: Internal server error
 */
router.put('/:id/items/:item_id', verifyToken, async (req, res) => {
    const { id, item_id } = req.params;
    const { quantity } = req.body;

    if (!quantity) {
        return res.status(400).send({ error: 'Missing required field: quantity.' });
    }

    try {
        const { data: cartItem, error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('cart_id', id)
            .eq('id', item_id)
            .select();

        if (error) {
            console.error(error);
            return res.status(500).send({ error: 'Failed to update item quantity.' });
        }

        res.status(200).send({ message: 'Item quantity updated successfully.', data: cartItem });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /carts/{id}/items/{item_id}:
 *   delete:
 *     summary: Delete item from cart
 *     description: Delete a specific item from a cart
 *     tags: [Carts]
 *     security:
 *       - Bearer Token: Bearer {token}
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The cart ID
 *       - in: path
 *         name: item_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The cart item ID
 *     responses:
 *       200:
 *         description: Item deleted from cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/items/:item_id', verifyToken, async (req, res) => {
    const { id, item_id } = req.params;

    try {
        const { data, error } = await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', id)
            .eq('id', item_id);

        if (error) {
            console.error(error);
            return res.status(500).send({ error: 'Failed to delete item from cart.' });
        }

        res.status(200).send({ message: 'Item deleted from cart successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

/**
 * @swagger
 * /carts/{id}:
 *   delete:
 *     summary: Delete a cart
 *     description: Delete a specific cart by ID
 *     tags: [Carts]
 *     security:
 *       - Bearer Token: Bearer {token}
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The cart ID
 *     responses:
 *       200:
 *         description: Cart deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('carts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(error);
            return res.status(500).send({ error: 'Failed to delete cart.' });
        }

        res.status(200).send({ message: 'Cart deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

module.exports = router;
