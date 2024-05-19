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
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   password:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
router.get('/', async function (req, res, next) {
  const { data, error } = await supabase
    .from('users')
    .select();
  console.log(data, error);
  if (error) {
    return res.status(500).send({ error: 'Failed to fetch users.' });
  }
  res.send(data);
});

/**
 * @swagger
 * /users/sign/in:
 *   post:
 *     summary: Sign in a user
 *     description: Authenticate a user with email and password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: userpassword
 *     responses:
 *       200:
 *         description: User signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         token:
 *                           type: string
 *       400:
 *         description: Missing or invalid fields
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */
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

  const token = jwt.sign({ userId: user.id }, JWT_SECRET_KEY, {
    expiresIn: '1h',
  });

  // User successfully signed in
  res.send({
    message: 'Sign-in successful.',
    data: { user: { ...user, token: token } }
  });
});

/**
 * @swagger
 * /users/sign/up:
 *   post:
 *     summary: Sign up a new user
 *     description: Create a new user with name, email, and password
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: userpassword
 *     responses:
 *       200:
 *         description: User signed up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Missing or invalid fields
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
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
