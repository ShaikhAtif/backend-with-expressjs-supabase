var express = require('express');
var { createClient } = require('@supabase/supabase-js');
var router = express.Router();
var env = require("dotenv");
const bcrypt = require('bcrypt');

env.config();

const supabaseUrl = 'https://cihwtaciqnlnxxjygbht.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const saltRounds = process.env.SALT_ROUND ? parseInt(process.env.SALT_ROUND) : 10
const supabase = createClient(supabaseUrl, supabaseKey)

/* GET users listing. */
router.get('/', async function (req, res, next) {
  const { data, error } = await supabase
    .from('users')
    .select()
  console.log(data, error);
  res.send(data);
});

router.post('/sign/in', async function (req, res, next) {
  // Check for required fields
  if (!req.body.email || !req.body.password) {
    return res.status(400).send({ error: 'Missing required fields.' });
  }

  // Validate email format
  if (!/\S+@\S+\.\S+/.test(req.body.email)) {
    return res.status(400).send({ error: 'Invalid email format.' });
  }

  // Find the user by email
  const { data: user, error } = await supabase
    .from('users')
    .select()
    .eq('email', req.body.email)
    .single();

  if (error) {
    console.error(error);
    return res.status(500).send({ error: 'Failed to find user.' });
  }

  if (!user) {
    return res.status(401).send({ error: 'Invalid email or password.' });
  }

  const doesPasswordMatch = await bcrypt.compare(req.body.password, user.password);

  if (!doesPasswordMatch) {
    return res.status(401).send({ error: 'Invalid email or password.' });
  }

  // User successfully signed in
  res.send({ message: 'Sign-in successful.', data: user });
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
    if (error.code === '23505') {
      return res.status(409).send({ error: 'Email already exists.' });
    }
    res.status(500).send({ error: 'Failed to sign up user.' });
  } else {
    res.send({ message: 'User signed up successfully.', data: data });
  }
});


module.exports = router;
