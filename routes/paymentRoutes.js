const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')
const bodyParser = require('body-parser')

router
  .route('/create-payment-session')
  .post(paymentController.createCheckoutSession)

router.route('/get-price-data').get(paymentController.getPriceData)

router.route('/get-tokens/:id').get(paymentController.getTokenCount)

router
  .route('/webhook')
  .post(
    bodyParser.raw({ type: 'application/json' }),
    paymentController.successfulPayment
  )

module.exports = router
