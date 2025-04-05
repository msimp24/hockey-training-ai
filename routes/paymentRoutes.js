const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')

router
  .route('/create-payment-session')
  .post(paymentController.createCheckoutSession)

router.route('/get-price-data').get(paymentController.getPriceData)

router.route('/get-tokens/:id').get(paymentController.getTokenCount)

router
  .route('/webhook')
  .post(
    express.raw({ type: 'application/json' }),
    paymentController.successfulPayment
  )

module.exports = router
