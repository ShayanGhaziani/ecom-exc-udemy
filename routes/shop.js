const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middlewares/is-auth');


const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart', isAuth, shopController.postCart);

router.post('/cart-delete-item', shopController.postCartDeleteProduct);
router.post('/cart-add-item', shopController.postCartAddProduct);
router.post('/cart-dec-item', shopController.postCartDecProduct);

router.post('/create-order',  shopController.postOrder);

router.get('/orders', isAuth, shopController.getOrders);

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

module.exports = router;
