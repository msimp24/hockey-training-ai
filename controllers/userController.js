const db = require('../config/db')
const { Resend } = require('resend')
const resend = new Resend(process.env.MAIL_KEY)

const getUserById = (req, res) => {
  const userId = req.params.id

  let query = 'SELECT id, firstName, lastName, email from users where id = (?)'

  db.get(query, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({
        status: 'Failed',
        message: 'Internal service error',
      })
    } else {
      if (!row) {
        return res.status(404).json({
          status: 'Failed',
          message: 'User with that ID not found',
        })
      } else {
        return res.status(200).send(row)
      }
    }
  })
}

const getTokenTransactionByUser = (req, res) => {
  const userId = req.params.id

  let query = `SELECT 
  a.workoutId, 
  a.programName, 
  a.created_at, 
  b.user_id, 
  b.amount 
FROM workouts a
JOIN token_transactions b ON a.workoutId = b.workoutId
WHERE b.user_id = ?
`

  db.all(query, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({
        status: 'Failed',
        message: 'Internal service error',
      })
    } else {
      if (!row) {
        return res.status(404).json({
          status: 'Failed',
          message: 'User with that ID not found',
        })
      } else {
        return res.status(200).send(row)
      }
    }
  })
}

const getPaymentTransactionsByUser = (req, res) => {
  const userId = req.params.id

  let query = 'SELECT * from payment_transactions where user_id = (?)'

  db.get(query, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({
        status: 'Failed',
        message: 'Internal service error',
      })
    } else {
      if (!row) {
        return res.status(404).json({
          status: 'Failed',
          message: 'User with that ID not found',
        })
      } else {
        return res.status(200).send(row)
      }
    }
  })
}

const updateUserProfile = (req, res) => {
  const { firstName, lastName, userId } = req.body

  let query = 'update users set firstName = ?, lastName = ? where id = ?'

  db.run(query, [firstName, lastName, userId], (err) => {
    if (err) {
      return res.status(500).json({
        status: 'Failed',
        message: 'Internal service error',
      })
    } else {
      return res.status(200).json({
        status: 'success',
        message: 'User name successfully changed',
      })
    }
  })
}

const contactUs = (req, res) => {
  const { firstName, lastName, email, message, subject } = req.body

  let htmlContent = `
  <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Contact Form Submission</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        color: #333333;
        background-color: #f9f9f9;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: auto;
        background: #ffffff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
      }
      .header {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #2c3e50;
      }
      .row {
        margin-bottom: 15px;
      }
      .label {
        font-weight: bold;
        color: #555555;
      }
      .value {
        margin-top: 5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">New Contact Form Submission</div>
      <div class="row">
        <div class="label">First Name:</div>
        <div class="value">${firstName}</div>
      </div>
      <div class="row">
        <div class="label">Last Name:</div>
        <div class="value">${lastName}</div>
      </div>
      <div class="row">
        <div class="label">Email:</div>
        <div class="value">${email}</div>
      </div>
      <div class="row">
        <div class="label">Subject:</div>
        <div class="value">${subject}</div>
      </div>
      <div class="row">
        <div class="label">Message:</div>
        <div class="value">${message}</div>
      </div>
    </div>
  </body>
</html>

  `
  resend.emails
    .send({
      from: `${firstName} ${lastName} <noreply@${process.env.MAIL_DOMAIN}>`,
      to: `info@hockey-training-ai.com`,
      subject: `${subject}`,
      html: htmlContent,
    })
    .then(() => {
      return res.status(200).json({
        status: 'Success',
        message: 'Email received',
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

module.exports = {
  getUserById,
  getTokenTransactionByUser,
  updateUserProfile,
  contactUs,
}
