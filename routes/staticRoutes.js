const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/authenticate')

router.route('/').get((req, res) => {
  res.render('index', { title: 'Home' })
})

router.route('/register').get((req, res) => {
  res.render('register', { title: 'Register' })
})

router.route('/login').get((req, res) => {
  res.render('login', { title: 'Login Page' })
})

router.route('/verify-email').get((req, res) => {
  res.render('verify-email', { title: 'Verify Email' })
})

router.route('/forgot-password').get((req, res) => {
  res.render('forgot-password', { title: 'Forgot Password' })
})
router.route('/about').get((req, res) => {
  res.render('about', { title: 'About Page' })
})

router.route('/contact').get((req, res) => {
  res.render('contact', { title: 'Contact Us Page' })
})

router.route('/auth/reset-password/:token').get((req, res) => {
  res.render('reset-password', { title: 'Reset Password' })
})

router
  .route('/admin')
  .get(authenticate.protectRoute, authenticate.isAdmin, (req, res) => {
    res.render('admin', { title: 'Admin' })
  })

module.exports = router
