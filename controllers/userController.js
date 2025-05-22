const db = require('../config/db')

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

  let query = 'SELECT * from token_transactions where user_id = (?)'

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

module.exports = { getUserById, getTokenTransactionByUser, updateUserProfile }
