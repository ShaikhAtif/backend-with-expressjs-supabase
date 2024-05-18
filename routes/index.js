var express = require('express');
var {createClient} = require('@supabase/supabase-js');
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

router.get('/products', async (req, res) => {
    const {data, error} = await supabase
        .from('products')
        .select()
    console.log(data, error);
    res.send(data);
});

router.get('/products/add', async (req, res) => {
    const {data, error} = await supabase
        .from('products')
        .insert({ id: 5, name: 'Denmark' })
    console.log(data, error);
    res.send(data);
});
module.exports = router;
