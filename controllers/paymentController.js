const db = require('../config/db')
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)

const { Resend } = require('resend')

const currDomain = process.env.FRONTEND_URL

const resend = new Resend(process.env.MAIL_KEY)

const createCheckoutSession = async (req, res) => {
  const id = req.body.id
  const userId = req.body.userId
  let item

  db.get(
    'SELECT id, package_name, token_amount, price from tokens where id = (?)',
    [id],
    async (err, row) => {
      if (err) {
        return res.status(500).json({
          status: 'failed',
          message: 'Internal service error',
        })
      } else {
        if (!row) {
          return res.status(404).json({
            status: 'failed',
            message: 'Row with that id not found',
          })
        }

        item = row

        try {
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [
              {
                price_data: {
                  currency: 'cad',
                  product_data: {
                    name: `${item.package_name} - ${item.token_amount} Tokens`,
                  },
                  unit_amount: item.price * 100, // price in cents
                },
                quantity: 1,
              },
            ],
            success_url: `https://hockey-training-ai.com/dashboard/create-workout`,
            cancel_url: `https://hockey-training-ai.com/dashboard/buy-tokens`,
            metadata: {
              userId: userId,
              tokenAmount: item.token_amount,
            },
          })
          res.status(200).json({ url: session.url })
        } catch (err) {
          res.status(500).json({
            status: 'failed',
            message: err,
          })
        }
      }
    }
  )
}

const getPriceData = (req, res) => {
  db.all('SELECT * FROM tokens', (err, rows) => {
    if (err) {
      return res.status(500).json({
        status: 'failed',
        message: 'Internal Service Err: ' + err,
      })
    } else {
      if (!rows) {
        return res.status(404).json({
          status: 'failed',
          message: 'Could not find any rows',
        })
      } else {
        return res.status(200).send(rows)
      }
    }
  })
}

const getTokenCount = (req, res) => {
  const userId = req.params.id

  db.get('SELECT tokens from users where id = (?)', [userId], (err, tokens) => {
    if (err) {
      return res.status(500).json({
        status: 'failed',
        message: 'Internal Service Err: ' + err,
      })
    } else {
      return res.status(200).send(tokens)
    }
  })
}

const testBodyParser = (req, res) => {
  console.log(req.body)

  res.send('this is a webhook route')
}

const successfulPayment = async (req, res) => {
  const sig = req.headers['stripe-signature']
  console.log(req.body)
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}, ${req.body}`)
  }

  // Handle the checkout session
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const email = session.customer_details.email
    const amountPaid = session.amount_total / 100
    const stripePaymentId = session.id
    const userId = session.metadata.userId
    const tokenAmount = session.metadata.tokenAmount

    console.log('✅ Checkout Session Completed:')
    console.log(`👤 Email: ${email}`)
    console.log(`💵 Amount Paid: $${amountPaid}`)
    console.log(`🆔 Stripe Payment ID: ${stripePaymentId}`)
    console.log(`💵 User Id: $${userId}`)
    console.log(`🆔 Token Amount${tokenAmount}`)

    try {
      addPaymentTransactionInfo(
        userId,
        amountPaid,
        stripePaymentId,
        tokenAmount
      )
      addTokensToUser(userId, tokenAmount)

      createInvoice(userId, amountPaid, stripePaymentId, tokenAmount, email)
    } catch (err) {
      console.error('Unexpected DB error:', err)
    }
  }

  // Always respond with 200 OK
  res.status(200).json({ received: true })
}

const addTokensToUser = (userId, tokenAmount) => {
  const query = 'UPDATE users SET tokens = tokens + ? WHERE id = ?'

  db.run(query, [tokenAmount, userId], (err) => {
    if (err) {
      console.error('Failed to update tokens:', err.message)
    }
  })
}

//Create function that tracks invoice info of the user that had paid

const addPaymentTransactionInfo = (userId, amount, stripeId, tokenAmount) => {
  const query =
    'INSERT INTO payment_transactions(user_id, stripe_payment_id, amount, token_amount) values(?, ?, ?, ?)'

  db.run(query, [userId, stripeId, amount, tokenAmount], (err) => {
    if (err) {
      console.error('Failed to update payment transactions:', err.message)
    }
  })
}

const createInvoice = (
  userId,
  amountPaid,
  stripePaymentId,
  tokenAmount,
  email
) => {
  let firstName, lastName

  db.get(
    'select firstName, lastName from users where id = ?',
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          status: 'failed',
          message: err,
        })
      } else {
        firstName = row.firstName
        lastName = row.lastName

        const date = new Date().toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })

        //email sent to user with invoice

        const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Invoice</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 20px;
        color: #333;
      }
      .invoice-box {
        max-width: 700px;
        margin: auto;
        background: #ffffff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
      h1 {
        text-align: center;
        color: #333;
        margin-bottom: 30px;
      }
      .header, .footer {
        text-align: center;
        color: #777;
        font-size: 13px;
      }
      .info-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
      }
      .info-table td {
        padding: 8px 0;
      }
      .info-table .label {
        font-weight: bold;
        width: 200px;
        vertical-align: top;
      }
      .summary-box {
        border-top: 1px solid #eee;
        padding-top: 20px;
      }
      .summary-box p {
        font-size: 16px;
        margin: 5px 0;
      }
    </style>
  </head>
  <body>
    <div class="invoice-box">
      <h1>Payment Confirmation</h1>

      <p class="header">Thank you for your purchase, <strong>${firstName} ${lastName}</strong>!</p>

      <table class="info-table">
        <tr>
          <td class="label">Email:</td>
          <td>${email}</td>
        </tr>
        <tr>
          <td class="label">Order Number:</td>
          <td>${stripePaymentId}</td>
        </tr>
        <tr>
          <td class="label">Date:</td>
          <td>${date}</td>
        </tr>
        <tr>
          <td class="label">Tokens Purchased:</td>
          <td>${tokenAmount}</td>
        </tr>
        <tr>
          <td class="label">Amount Paid:</td>
          <td><strong>$${amountPaid}</strong></td>
        </tr>
      </table>

      <div class="summary-box">
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>We hope to see you back soon!</p>
      </div>

      <p class="footer">&copy; 2025 Hockey Training AI</p>
    </div>
  </body>
</html>
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
              message: 'Invoice sent to user',
            })
          })
          .catch((err) => {
            console.error('Resend Email Error:', err)
            return res.status(500).json({
              status: 'Failed',
              message: 'Failed to send invoice to user',
            })
          })
      }
    }
  )
}

module.exports = {
  createCheckoutSession,
  getPriceData,
  getTokenCount,
  successfulPayment,
  testBodyParser,
}
