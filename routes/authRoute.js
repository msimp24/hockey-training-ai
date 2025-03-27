const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')

router.route('/register').post(authController.registerUser)

router.route('/login').post(authController.loginUser)

router.route('/logout').post(authController.logout)

router.route('/verify-email/:token').get(authController.verifyEmail)

router.route('/forgot-password').post(authController.forgotPassword)

router.route('/reset-password/:token').post(authController.resetPassword)

router.route('/check-auth').get(authController.checkAuth)

module.exports = router
