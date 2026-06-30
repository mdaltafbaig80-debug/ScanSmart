const express = require('express');
const router  = express.Router();
const cartController = require('../controllers/cartController');
const { auth } = require('../middleware/auth');
const { validate, addToCartRules, updateCartRules, idParam } = require('../middleware/validate');

// All cart routes require authentication
router.get('/',                auth, cartController.getCart);
router.post('/add',            auth, addToCartRules,  validate, cartController.addToCart);
router.put('/update',          auth, updateCartRules, validate, cartController.updateQuantity);
router.delete('/remove/:productId', auth, idParam, validate, cartController.removeFromCart);
router.delete('/clear',        auth, cartController.clearCart);

module.exports = router;
