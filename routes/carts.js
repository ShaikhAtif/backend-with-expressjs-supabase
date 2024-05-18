var express = require('express');
var { createClient } = require('@supabase/supabase-js');
var router = express.Router();
var env = require("dotenv");

env.config();

/* GET home page. */
router.get('/uu', (req, res, next) => {
    res.render('index', { title: 'Express22222233' });
});

const supabaseUrl = 'https://cihwtaciqnlnxxjygbht.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

router.get('/', async (req, res) => {
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

        res.send(cart);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { data: cart, error: cartError } = await supabase
            .from('carts')
            .select('*, cart_items:cart_items(*)') // Join with cart_items
            .eq('id', id)
            .single();

        if (cartError) {
            console.error(cartError);
            return res.status(500).send({ error: 'Failed to retrieve cart.' });
        }

        if (!cart) {
            return res.status(404).send({ error: 'Cart not found.' });
        }

        res.send(cart);
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

router.post('/', async (req, res) => {
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

        res.send({ message: 'Cart created successfully.', data: cart });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

router.post('/:id/items', async (req, res) => {
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

        res.send({ message: 'Item added to cart successfully.', data: cartItem });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

router.put('/:id/items/:item_id', async (req, res) => {
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

        res.send({ message: 'Item quantity updated successfully.', data: cartItem });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

router.delete('/:id/items/:item_id', async (req, res) => {
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

        res.send({ message: 'Item deleted from cart successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

router.delete('/:id', async (req, res) => {
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

        res.send({ message: 'Cart deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Internal server error.' });
    }
});

module.exports = router;
