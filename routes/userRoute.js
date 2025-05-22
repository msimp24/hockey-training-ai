const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')

router.route('/:id').get(userController.getUserById)

//user token transactions

//user purchase transactions

//updates user profile
router.route('/update-names').put(userController.updateUserProfile)

module.exports = router
