const db = require('../config/db')
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)

const createCheckoutSession = async (req, res) => {
  const { id } = req.body
  let item

  console.log(id)

  db.get(
    'SELECT id, package_name, token_amount, price from tokens where id = (?)',
    [id],
    async (err, row) => {
      if (err) {
        return res.status(500).json({
          status: 'failed',
          messaeg: 'Internal service error',
        })
      } else {
        if (!row) {
          return res.status(404).json({
            status: 'failed',
            messaeg: 'Row with that id not found',
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

module.exports = { createCheckoutSession, getPriceData }
