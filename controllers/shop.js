const Product = require('../models/product');
const Order = require('../models/order');

const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

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
      if (products[0].cartItem.quantity <= 1) {
        return products[0].cartItem.destroy();
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
  req.user.getOrders({ include: ['products'] })
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


exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findByPk(orderId)
  .then(order => {
    if (!order) {
      return next(new Error('Order not found'));
    }
    if (order.userId !== req.user.id) {
      return next(new Error('Unauthorized'));
    }
    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('invoices', invoiceName);

    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc.fontSize(26).text('Invoice', {
      underline: true
    });
    pdfDoc.text('------------------------');
    let totalPrice = 0;
    order.getProducts().then(products => {
      products.forEach(prod => {
        totalPrice += prod.orderItem.quantity * prod.price;
        pdfDoc.fontSize(14).text(
          prod.title +
            ' - ' +
            prod.orderItem.quantity +
            'x' +
            prod.price +
            '$'
        );
      });
      pdfDoc.text('------------------------');
      pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
      pdfDoc.end();
    });
  })
  .catch(err => { return next(err); });
};
