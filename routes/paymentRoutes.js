const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')

router
  .route('/create-payment-session')
  .post(paymentController.createCheckoutSession)

router.route('/get-price-data').get(paymentController.getPriceData)

module.exports = router
