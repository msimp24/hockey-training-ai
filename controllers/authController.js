const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const db = require('../config/db')
const crypto = require('crypto')

const { Resend } = require('resend')

const currDomain = process.env.FRONTEND_URL

const resend = new Resend(process.env.MAIL_KEY)

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.SECRET_KEY, { expiresIn: '2hr' })
}

const registerUser = (req, res) => {
  const { email, password, firstName, lastName } = req.body

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      console.error('Database error:', err)
      return res.status(500).json({
        status: 'Failed',
        message: 'Internal service error',
      })
    }

    if (row) {
      return res.status(400).json({
        status: 'Failed',
        message: 'Already an account with that email.',
      })
    }

    const hash = bcrypt.hashSync(password, 10)
    const verificationToken = crypto.randomBytes(32).toString('hex')

    db.run(
      'INSERT INTO users (firstName, lastName, email, password, verification_token) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, email, hash, verificationToken],
      (err) => {
        if (err) {
          console.error('Insert error:', err)
          return res.status(500).json({
            status: 'Failed',
            message: 'User not added to database',
          })
        }

        const htmlContent = `
          <div style="font-family: sans-serif;">
            <h2>Hello, ${firstName} ${lastName}</h2>
            <p>Thank you for registering! Please verify your email by clicking the button below:</p>
            <a href="${process.env.FRONTEND_URL}/auth/verify-email/${verificationToken}" target="_blank"
              style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
              Verify Email
            </a>
          </div>
        `

        resend.emails
          .send({
            from: `Hockey Training AI <noreply@${process.env.MAIL_DOMAIN}>`,
            to: `${email}`,
            subject: 'Email Confirmation',
            html: htmlContent,
          })
          .then(() => {
            return res.status(200).json({
              status: 'Success',
              message: 'Account created and verification email sent',
            })
          })
          .catch((err) => {
            console.error('Resend Email Error:', err)
            return res.status(500).json({
              status: 'Failed',
              message: 'User created, but failed to send verification email',
            })
          })
      }
    )
  })
}

const verifyEmail = (req, res) => {
  const token = req.params.token

  db.get(
    'SELECT * FROM users where verification_token = ?',
    [token],
    (err, row) => {
      if (err) {
        res.status(500).json({
          status: 'failed',
          message: err,
        })
      } else {
        if (!row) {
          return res.status(500).json({
            status: 'failed',
            message: 'Invalid link',
          })
        }
        if (row.verified == 1) {
          res.status(200).json({
            status: 'success',
            message: 'User has already verified email',
          })
        } else {
          db.run(
            'UPDATE users SET verified = 1 where verification_token = ?',
            [row.verification_token],
            (err, row) => {
              if (err) {
                res.status(500).json({
                  status: 'failed',
                  message: 'Unable to verify email',
                })
              } else {
                return res.redirect('/login')
              }
            }
          )
        }
      }
    }
  )
}

const loginUser = (req, res) => {
  const email = req.body.email.toLowerCase()
  const password = req.body.password

  console.log(email)

  db.get('SELECT * FROM users where email = ?', [email], (err, user) => {
    if (err) {
      res.status(404).json({
        status: 'failed',
        message: 'User with that email not found',
      })
    } else {
      if (!user) {
        return res.status(404).json({
          status: 'failed',
          message: 'User with that email not found',
        })
      }

      const checkPass = bcrypt.compareSync(password, user.password)

      if (!checkPass) {
        res.status(401).json({
          status: 'failed',
          message: 'Incorrect email or password',
        })
      } else {
        if (user.verified == 1) {
          let token = generateToken(user.id)

          res.cookie('token', token, {
            httpOnly: true,
            secure: true, // Use only with HTTPS
            sameSite: 'None', // Protects against CSRF attacks
            maxAge: 60 * 60 * 2000, // 1 hour expiry
          })
          res
            .status(200)
            .json({ status: 'success', message: 'Login successful' })
        } else {
          res.status(401).json({
            status: 'failed',
            message: 'User needs to authenticate email',
          })
        }
      }
    }
  })
}

const forgotPassword = (req, res) => {
  const email = req.body.email

  //db lookup to see if account exists with this email

  db.get('SELECT email from users where email = (?)', [email], (err, row) => {
    if (err) {
      return res.status(500).json({
        status: 'failed',
        message: err,
      })
    } else {
      if (!row) {
        return res.status(404).json({
          status: 'failed',
          message: 'There is no account with this email',
        })
      }

      const passVeficationToken = crypto.randomBytes(32).toString('hex')

      db.run(
        'update users set password_reset_token = ? where email = ?',
        [passVeficationToken, email],
        (err) => {
          if (err) {
            return res.status(500).json({
              status: 'failed',
              message: err,
            })
          } else {
            let htmlContent = `
            <div style="font-family: sans-serif;">
              <p>Click the reset password button below to reset your password</p>
              <a href="${currDomain}/auth/reset-password/${passVeficationToken}"
              style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </div>`

            resend.emails
              .send({
                from: `Hockey Training AI <noreply@${process.env.MAIL_DOMAIN}>`,
                to: `${email}`,
                subject: 'Email Confirmation',
                html: htmlContent,
              })
              .then(() => {
                return res.status(200).json({
                  status: 'Success',
                  message: 'Password reset verification sent',
                })
              })
              .catch((err) => {
                console.error('Resend Email Error:', err)
                return res.status(500).json({
                  status: 'Failed',
                  message: 'Password token failed to send',
                })
              })
          }
        }
      )
    }
  })
}

const resetPassword = (req, res) => {
  const token = req.params.token
  const password = req.body.password

  db.get(
    'SELECT * from users where password_reset_token = ?',
    [token],
    (err, user) => {
      if (err) {
        res.status(500).json({
          status: 'failed',
          message: err,
        })
      } else {
        if (!user) {
          res.status(404).json({
            status: 'failed',
            message: 'Reset token does not match that of any user',
          })
        } else {
          const hash = bcrypt.hashSync(password, 10)

          db.run(
            'update users set password = ? where email = ?',
            [hash, user.email],
            (err) => {
              if (err) {
                res.status(500).json({
                  status: 'failed',
                  message: err,
                })
              } else {
                db.run(
                  'update users set password_reset_token = NULL where email = ?',
                  [user.email],
                  (err) => {
                    if (err) {
                      res.status(500).json({
                        status: 'failed',
                        message: err,
                      })
                    } else {
                      res.status(200).json({
                        status: 'success',
                        message: 'Password successfully updated',
                      })
                    }
                  }
                )
              }
            }
          )
        }
      }
    }
  )
}

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: 'true',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path: '/',
  })

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  })
}

const checkAuth = (req, res) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ loggedIn: false })
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY)

    res.json({ loggedIn: true, userId: decoded.userId })
  } catch (error) {
    res.status(401).json({ loggedIn: false })
  }
}

module.exports = {
  registerUser,
  loginUser,
  generateToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  checkAuth,
}
