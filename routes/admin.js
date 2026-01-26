const path = require('path');

const express = require('express');

const adminController = require('../controllers/admin');
const isAuth = require('../middlewares/is-auth');


const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth,  adminController.getAddProduct);

// /admin/products => GET
router.get('/products', adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', adminController.getEditProduct);

router.post('/edit-product', adminController.postEditProduct);

// router.post('/delete-product', adminController.postDeleteProduct);
router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
