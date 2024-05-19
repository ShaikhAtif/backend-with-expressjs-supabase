var express = require('express');
var { createClient } = require('@supabase/supabase-js');
var router = express.Router();
var env = require("dotenv");

env.config();

const supabaseUrl = 'https://cihwtaciqnlnxxjygbht.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     description: Retrieve a list of products, optionally filtered by category
 *     tags: [Products]
 *     security:
 *       - bearerAuth: Bearer {token}
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category to filter by
 *     responses:
 *       200:
 *         description: A list of products
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
    const { category } = req.query;

    const query = supabase.from('products').select();

    if (category) {
        query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to retrieve products.' });
    } else {
        res.status(200).send(data);
    }
});

/**
 * @swagger
 * /products/add:
 *   post:
 *     summary: Add a new product
 *     description: Create a new product with the provided details
 *     tags: [Products]
 *     security:
 *       - bearerAuth: Bearer {token}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/add', verifyToken, async (req, res) => {
    const { name, description, price, category } = req.body;

    if (!name || !description || !price || !category) {
        return res.status(400).send({ error: 'Missing required fields.' });
    }

    const { data, error } = await supabase
        .from('products')
        .insert({ name, description, price, category })
        .select();

    if (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to create product.' });
    } else {
        res.status(201).send({ message: 'Product created successfully.', data });
    }
});

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     description: Update a product with the provided details
 *     tags: [Products]
 *     security:
 *       - bearerAuth: Bearer {token}
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category } = req.body;

    if (!name || !description || !price || !category) {
        return res.status(400).send({ error: 'Missing required fields.' });
    }

    const { data, error } = await supabase
        .from('products')
        .update({ name, description, price, category })
        .eq('id', id)
        .select();

    if (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to update product.' });
    } else {
        res.status(200).send({ message: 'Product updated successfully.', data });
    }
});

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: Delete a product by its ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: Bearer {token}
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
  
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.error(error);
      res.status(500).send({ error: 'Failed to delete product.' });
    } else {
        res.status(200).send({ message: 'Product deleted successfully.' });
    }
  });
  
module.exports = router;
