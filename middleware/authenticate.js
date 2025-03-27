const db = require('../config/db')
const jwt = require('jsonwebtoken')

const protectRoute = (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res
      .status(401)
      .send('You are not logged in, please log in to get access')
  }

  const decoded = jwt.decode(token, process.env.SECRET_KEY)
  let userId = decoded.userId

  db.get('SELECT * FROM users where id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({
        status: 'failed',
        message: err,
      })
    } else {
      if (!user) {
        return res.status(500).json({
          status: 'failed',
          message: 'Cannot find a user with that id',
        })
      } else {
        if (user.verified == 0) {
          return res.status(500).json({
            status: 'failed',
            message: 'Email is not verified, access denied',
          })
        }

        req.user = user
        next()
      }
    }
  })
}

const isAdmin = (req, res, next) => {
  let user = req.user

  if (!user) {
    return res.status(404).json({
      status: 'failed',
      message: 'Cannot find user',
    })
  }

  if (user.role === 'user') {
    return res.status(500).json({
      status: 'failed',
      message: 'User does not have admin privileges',
    })
  }

  next()
}

module.exports = {
  isAdmin,
  protectRoute,
}
