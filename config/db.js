const sqlite3 = require('sqlite3')

const path = require('path')

const dbPath = path.join(__dirname, '../data/database.db')

let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log('Error occured' + err.message)
  } else {
    console.log('Database connected')
  }

  db.serialize(() => {
    db.run('PRAGMA journal_mode = WAL;') // Set WAL mode
    db.run('PRAGMA foreign_keys = ON;') // Optional: Enable foreign key support
  })
})

module.exports = db
