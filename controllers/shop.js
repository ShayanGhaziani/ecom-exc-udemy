const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
  Product.findAll()
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  // console.log('productId param:', prodId);
  Product.findByPk(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.cart.getProducts()
    .then(products => {
      let totalSum = 0;
      products.forEach(p => {
        totalSum += p.price * p.cartItem.quantity;
      });
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        totalSum: totalSum
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchedProduct;
  let newQuantity = 1;

  req.cart
    .getProducts({ where: { id: prodId } })
    .then(products => {
      if (products.length > 0) {
        fetchedProduct = products[0];
        newQuantity = fetchedProduct.cartItem.quantity + 1;
        return fetchedProduct;
      }
      return Product.findByPk(prodId);
    })
    .then(product => {
      if (!product) {
        return res.redirect('/cart'); // product deleted or invalid
      }

      return req.cart.addProduct(product, {
        through: { quantity: newQuantity }
      });
    })
    .then(() => {
      res.redirect('/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.cart
    .getProducts({ where: { id: prodId } })
    .then(products => {
      if (products.length === 0) {
        return res.redirect('/cart');
      }
      return products[0].cartItem.destroy();
    })
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartAddProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.cart
    .getProducts({ where: { id: prodId } })
    .then(products => {
      if (products.length === 0) {
        return res.redirect('/cart');
      }
      return products[0].cartItem.increment('quantity', { by: 1 });
    })
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDecProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.cart
    .getProducts({ where: { id: prodId } })
    .then(products => {
      if (products.length === 0) {
        return res.redirect('/cart');
      }
      return products[0].cartItem.decrement('quantity', { by: 1 });
    })
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postOrder = (req, res, next) => {
  let fetchedCart;
  req.user
    .getCart()
    .then(cart => {
      fetchedCart = cart;
      return cart.getProducts();
    })
    .then(products => {
      if (products.length === 0) {
        return res.redirect('/cart');
      }

      return req.user.createOrder().then(order => {
        return order.addProducts(
          products.map(product => {
            product.orderItem = {
              quantity: product.cartItem.quantity
            };
            return product;
          })
        );
      });
    })
    .then(() => {
      return fetchedCart.setProducts(null);
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getOrders = (req, res, next) => {
  req.user
    .getOrders({include: ['products']})
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
