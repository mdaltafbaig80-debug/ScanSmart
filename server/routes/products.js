const express = require('express');
const router  = express.Router();
const productController = require('../controllers/productController');
const { auth, adminAuth } = require('../middleware/auth');
const { validate, productRules, stockRules, idParam } = require('../middleware/validate');

// Public routes
router.get('/',           productController.getAllProducts);
router.get('/categories', productController.getCategories);

// SECURITY: specific routes BEFORE :id to prevent route hijacking
router.get('/admin/low-stock', adminAuth, productController.getLowStock);
router.get('/qr/:qrCode',      productController.getProductByQR);
router.get('/:id',             productController.getProductById);

// Admin-only write routes — validated + admin-authenticated
router.post('/',         adminAuth, productRules, validate, productController.addProduct);
router.put('/:id',       adminAuth, idParam, productRules, validate, productController.updateProduct);
router.delete('/:id',    adminAuth, idParam, validate, productController.deleteProduct);
router.patch('/:id/stock', adminAuth, idParam, stockRules, validate, productController.updateStock);

module.exports = router;
