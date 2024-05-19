var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var swaggerjsdoc = require('swagger-jsdoc');
var swaggerUi = require('swagger-ui-express');
// var swaggerOptions = require('./configurations/swaggerConfiguration');

var productsRouter = require('./routes/products');
var usersRouter = require('./routes/users');
var cartsRouter = require('./routes/carts');
var ordersRouter = require('./routes/orders');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

const swaggerOptions = {
  swaggerDefinition: {
      openapi: '3.0.0',
      info: {
          title: '',
          description: '',
          contact: {
              name: 'Muhammad Atif'
          },
      },
      servers: [
          {
              url: "http://localhost:3000/"
          }
      ],

      tags: [
        {
            name: 'Products',
            description: 'API for managing products'
        },
        {
            name: 'Users',
            description: 'API for managing users'
        },
        {
            name: 'Carts',
            description: 'API for managing carts'
        },
        {
            name: 'Orders',
            description: 'API for managing orders'
        }
    ],
  },
  apis: ['./routes/*.js']
}

const swaggerDocs = swaggerjsdoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/products', productsRouter);
app.use('/carts', cartsRouter);
app.use('/users', usersRouter);
app.use('/orders', ordersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
