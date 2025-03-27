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

router
  .route('/admin')
  .get(authenticate.protectRoute, authenticate.isAdmin, (req, res) => {
    res.render('admin', { title: 'Admin' })
  })

module.exports = router
