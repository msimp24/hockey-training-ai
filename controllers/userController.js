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

module.exports = { getUserById }
