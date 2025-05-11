const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')

router.route('/:id').get(userController.getUserById)

//user token transactions

//user purchase transactions

module.exports = router
