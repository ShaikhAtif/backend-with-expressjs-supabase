var express = require('express');
var { createClient } = require('@supabase/supabase-js');
var router = express.Router();
var env = require("dotenv");
const bcrypt = require('bcrypt');

env.config();

const supabaseUrl = 'https://cihwtaciqnlnxxjygbht.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

/* GET users listing. */
router.get('/get/all', async function (req, res, next) {
  const { data, error } = await supabase
    .from('users')
    .select()
  console.log(data, error);
  res.send(data);
});

router.post('/sign/in', function (req, res, next) {
  res.send('respond with a resource');
});

router.post('/sign/up', async function (req, res, next) {
  // Check for required fields
  if (!req.body.name || !req.body.email || !req.body.password) {
    return res.status(400).send({ error: 'Missing required fields.' });
  }

  // Validate email format
  if (!/\S+@\S+\.\S+/.test(req.body.email)) {
    return res.status(400).send({ error: 'Invalid email format.' });
  }

  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

  // Insert the user with the hashed password
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to sign up user.' });
  } else {
    res.send({ data: 'User signed up successfully.' });
  }
});


module.exports = router;
