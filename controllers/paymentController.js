const db = require('../config/db')
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)

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
            success_url: `http://68.183.194.171:3000/dashboard/create-workout`,
            cancel_url: `http://68.183.194.171:3000/dashboard/buy-tokens`,
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

module.exports = {
  createCheckoutSession,
  getPriceData,
  getTokenCount,
  successfulPayment,
  testBodyParser,
}
