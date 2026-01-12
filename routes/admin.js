const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');
const authController = require('../controllers/auth');


const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', authController.isAuth,  adminController.getAddProduct);

// /admin/products => GET
router.get('/products', adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', authController.isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', adminController.getEditProduct);

router.post('/edit-product', adminController.postEditProduct);

router.post('/delete-product', adminController.postDeleteProduct);

module.exports = router;
