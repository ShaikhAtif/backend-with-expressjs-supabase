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

router.get('/get/all', async (req, res) => {
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
        res.send(data);
    }
});


router.post('/add', async (req, res) => {
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
        res.send({ message: 'Product created successfully.', data });
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, price, category } = req.body;

    const { data, error } = await supabase
        .from('products')
        .update({ name, description, price, category })
        .eq('id', id)
        .select();

    if (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to update product.' });
    } else {
        res.send({ message: 'Product updated successfully.', data });
    }
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
  
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.error(error);
      res.status(500).send({ error: 'Failed to delete product.' });
    } else {
      res.send({ message: 'Product deleted successfully.' });
    }
  });
  
module.exports = router;
