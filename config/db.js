const sqlite3 = require('sqlite3')

const path = require('path')

const dbPath = path.join(__dirname, '../data/database.db')

let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log('Error occured' + err.message)
  } else {
    console.log('Database connected')
  }
})

module.exports = db
