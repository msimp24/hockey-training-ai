const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')

router
  .route('/')
  .post(
    express.raw({ type: 'application/json' }),
    paymentController.successfulPayment
  )

router
  .route('/tester')
  .get(
    express.raw({ type: 'application/json' }),
    paymentController.testBodyParser
  )

module.exports = router
