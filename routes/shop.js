const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', authController.isAuth, shopController.getCart);

router.post('/cart', authController.isAuth, shopController.postCart);

router.post('/cart-delete-item', authController.isAuth, shopController.postCartDeleteProduct);

router.post('/create-order', authController.isAuth, shopController.postOrder);

router.get('/orders', authController.isAuth, shopController.getOrders);
router.post('/orders', authController.isAuth, shopController.postOrder);

module.exports = router;
