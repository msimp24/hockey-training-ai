const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')

router.route('/:id').get(userController.getUserById)

//user token transactions
router
  .route('/token-transactions/:id')
  .get(userController.getTokenTransactionByUser)

//user purchase transactions

//updates user profile
router.route('/update-names').put(userController.updateUserProfile)

router.route('/contact').post(userController.contactUs)

module.exports = router
