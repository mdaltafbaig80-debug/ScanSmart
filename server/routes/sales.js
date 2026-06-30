const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');
const { adminAuth } = require('../middleware/auth');

// All sales routes are admin only
router.use(adminAuth);

router.get('/', salesController.getSalesData);
router.get('/by-product', salesController.getSalesByProduct);
router.get('/daily', salesController.getDailySales);
router.get('/ml-data/:productId', salesController.getMLTrainingData);
router.post('/predictions', salesController.storePrediction);

module.exports = router;
