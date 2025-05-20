const express = require('express')
const router = express.Router()

router.route('/').get((req, res) => {
  console.log('the secret key is')

  console.log(process.env.SECRET_KEY)
  res.render('dashboard-layout', { page: 'dashboard/dashboard' })
})

router.route('/all-workouts').get((req, res) => {
  res.render('dashboard-layout', { page: 'dashboard/all-workouts' })
})

router.route('/create-workout').get((req, res) => {
  res.render('dashboard-layout', { page: 'dashboard/create-workout' })
})

router.route('/how-to-videos').get((req, res) => {
  res.render('dashboard-layout', { page: 'dashboard/how-to-videos' })
})

router.route('/buy-tokens').get((req, res) => {
  res.render('dashboard-layout', { page: 'dashboard/buy-tokens' })
})
router.route('/profile').get((req, res) => {
  res.render('dashboard-layout', { page: 'dashboard/profile-layout' })
})

//dashboard profile routes

module.exports = router
