const express = require('express');
const router  = express.Router();
const discountController = require('../controllers/discountController');
const { auth, adminAuth } = require('../middleware/auth');
const { validate, discountRules, validateDiscountRules, idParam } = require('../middleware/validate');

// Admin-only CRUD
router.get('/',            adminAuth, discountController.getAllDiscounts);
router.post('/',           adminAuth, discountRules,  validate, discountController.createDiscount);
router.put('/:id',         adminAuth, idParam, validate, discountController.updateDiscount);
router.delete('/:id',      adminAuth, idParam, validate, discountController.deleteDiscount);
router.patch('/:id/toggle',adminAuth, idParam, validate, discountController.toggleDiscount);

// Customer: validate a discount code
router.post('/validate', auth, validateDiscountRules, validate, discountController.validateDiscount);

module.exports = router;
