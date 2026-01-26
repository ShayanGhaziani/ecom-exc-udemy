const Product = require('../models/product');
const Order = require('../models/order');

const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');

exports.getProducts = (req, res, next) => {
  const pageNum = +req.query.page || 0;
  const ITEMS_PER_PAGE = 6;
  Product.findAndCountAll({ limit: ITEMS_PER_PAGE, offset: pageNum * ITEMS_PER_PAGE })
    .then(products => {
      res.render('shop/products', {
        prods: products,
        pageNum: pageNum,
        pageTitle: 'All Products',
        path: '/products',
        currentPage: pageNum,
        hasNextPage: ITEMS_PER_PAGE * (pageNum + 1) < products.count,
        hasPreviousPage: pageNum > 0,
        nextPage: pageNum + 1,
        previousPage: pageNum - 1,
        lastPage: Math.ceil(products.count / ITEMS_PER_PAGE) - 1
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
  const pageNum = +req.query.page || 0;
  const ITEMS_PER_PAGE = 6;
  Product.findAndCountAll({ limit: ITEMS_PER_PAGE, offset: pageNum * ITEMS_PER_PAGE })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageNum: pageNum,
        pageTitle: 'Shop',
        path: '/',
        currentPage: pageNum,
        hasNextPage: ITEMS_PER_PAGE * (pageNum + 1) < products.count,
        hasPreviousPage: pageNum > 0,
        nextPage: pageNum + 1,
        previousPage: pageNum - 1,
        lastPage: Math.ceil(products.count / ITEMS_PER_PAGE) - 1
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

      pdfDoc
        .fontSize(26)
        .font('Helvetica-Bold')
        .text('Invoice for Order ' + order.id, { underline: true, align: 'center' })
        .moveDown();

      pdfDoc
        .fontSize(12)
        .font('Helvetica')
        .text('------------------------------------------------------------------------------------', { align: 'center' })
        .moveDown();

      let totalPrice = 0;

      order
        .getProducts()
        .then(products => {
          products.forEach(prod => {
            const quantity = prod.orderItem.quantity;
            const price = prod.price;
            const lineTotal = quantity * price;

            totalPrice += lineTotal;

            pdfDoc.text(
              `${prod.title}`,
              { continued: true }
            )
              .text(
                `${quantity} x ${price.toFixed(2)}  = ${lineTotal.toFixed(2)}$`,
                { align: 'right' }
              );
          });

          pdfDoc
            .moveDown()
            .text('------------------------------------------------------------------------------------', { align: 'center' })
            .moveDown();

          pdfDoc
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(`Total Price: ${totalPrice.toFixed(2)}$`, {
              align: 'right'
            });

          pdfDoc.end();
        })
        .catch(err => {
          console.error('Failed to generate invoice PDF:', err);
          pdfDoc.end();
        });

    })
    .catch(err => { return next(err); });
};
