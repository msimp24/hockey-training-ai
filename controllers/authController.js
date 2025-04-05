const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const db = require('../config/db')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport')

const currDomain = process.env.dev_url

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.SECRET_KEY, { expiresIn: '2hr' })
}

const mailgunAuth = {
  auth: {
    apiKey: process.env.MAIL_KEY,
    domain: 'sandbox53a2b5503c5043c7affab1c79415d821.mailgun.org',
  },
}
const smtpTransport = nodemailer.createTransport(mg(mailgunAuth))

const registerUser = (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const firstName = req.body.firstName
  const lastName = req.body.lastName

  db.get('SELECT * FROM users where email = ?', [email], (err, row) => {
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
      'INSERT INTO USERS(firstName, lastName, email, password, verification_token) values (?, ?, ?, ?, ?)',
      [firstName, lastName, email, hash, verificationToken],
      (err) => {
        if (err) {
          return res.status(500).json({
            status: 'Failed',
            message: 'User not added to database',
          })
        } else {
          smtpTransport.sendMail(
            {
              from: `no-reply <${process.env.MAIL_EMAIL}>`,
              to: `${firstName} ${lastName} <${email}>`,
              subject: 'Email Confirmation',
              html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            .btn {
              background-color: #4CAF50; /* Green button */
              color: white;
              padding: 15px 32px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              border-radius: 4px;
              font-size: 16px;
              cursor:pointer;
            }
            .btn:hover {
              background-color: #45a049;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Hello, ${firstName} ${lastName}</h2>
            <p>Thank you for registering! Please verify your email by clicking the button below:</p>
            <a href="${currDomain}/auth/verify-email/${verificationToken}" class="btn">Verify Email</a>
            <p>If you did not register with us, please ignore this email.</p>
          </div>
          ${currDomain}/auth/verify-email/${verificationToken}
        </body>
      </html>
    `,
            },
            (err, info) => {
              if (err) {
                console.error('Mailgun Error:', err)
                return res.status(500).json({
                  status: 'Failed',
                  message: 'Error sending verification email',
                })
              } else {
                console.log('Email Sent:', info)
                return res.status(200).json({
                  status: 'Success',
                  message: 'Account created and email sent for verification',
                })
              }
            }
          )
        }
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
                res.status(200).json({
                  status: 'success',
                  message: 'Account has been successfully verified',
                })
              }
            }
          )
        }
      }
    }
  )
}

const loginUser = (req, res) => {
  const email = req.body.email
  const password = req.body.password

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
            secure: false, // Use only with HTTPS
            sameSite: 'Strict', // Protects against CSRF attacks
            maxAge: 60 * 60 * 1000, // 1 hour expiry
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
            smtpTransport.sendMail(
              {
                from: `Mailgun Sandbox <${process.env.MAIL_EMAIL}>`,
                to: [`<${email}>`],
                subject: 'Email confirmation',
                text: `Hello, Click this link to reset your password.
                ${currDomain}/auth/reset-password/${passVeficationToken} 
                `,
              },
              (err, info) => {
                if (err) {
                  console.log('Error: ' + err)
                }

                console.log('Email sent:', info)
                return res.status(200).json({
                  status: 'success',
                  message: 'Password reset email sent successfully',
                })
              }
            )
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
