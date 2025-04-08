const db = require('../config/db')
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)

const createCheckoutSession = async (req, res) => {
  const id = req.body.id

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
            success_url: `${process.env.SERVER_URL}/dashboard/create-workout`,
            cancel_url: `${process.env.SERVER_URL}/dashboard/buy-tokens`,
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

    console.log('✅ Checkout Session Completed:')
    console.log(`👤 Email: ${email}`)
    console.log(`💵 Amount Paid: $${amountPaid}`)
    console.log(`🆔 Stripe Payment ID: ${stripePaymentId}`)
  }

  // Always respond with 200 OK
  res.status(200).json({ received: true })
}

module.exports = {
  createCheckoutSession,
  getPriceData,
  getTokenCount,
  successfulPayment,
  testBodyParser,
}
