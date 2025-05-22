require('dotenv').config()
const db = require('../config/db')
const axios = require('axios')

const apiKey = process.env.GPT_SECRET_KEY

const { getWorkoutFromPrompt } = require('./prompts')

const generateWorkout = async (req, res) => {
  const {
    userId,
    programName,
    age,
    skillLevel,
    availableEquipment,
    programDuration,
    workoutsPerWeek,
    timeLimit,
    improvements,
  } = req.body

  let data = {
    userId: userId,
    age: age,
    skillLevel: skillLevel,
    availableEquipment: availableEquipment,
    programDuration: programDuration,
    workoutsPerWeek: workoutsPerWeek,
    timeLimit: timeLimit,
    improvements: improvements,
  }

  try {
    const result = await getWorkoutFromPrompt(data, apiKey)

    const programSerialize = result.programSerialize
    const phaseSerialize = result.phaseSerialize
    const tokenCost = result.tokenCost

    let query = `INSERT INTO workouts (userId, programName,age, skillLevel,availableEquipment, programDuration, workoutsPerWeek,timeLimit,improvements, program, phase, isCurrent) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);`

    db.run(
      query,
      [
        userId,
        programName,
        age,
        skillLevel,
        availableEquipment,
        programDuration,
        workoutsPerWeek,
        timeLimit,
        improvements,
        programSerialize,
        phaseSerialize,
        1,
      ],
      function (err) {
        if (err) {
          console.error('Error inserting workout:', err.message)
          return res.status(500).send(err)
        } else {
          const workoutId = this.lastID // ✅ get the actual inserted workout ID

          let query =
            'INSERT INTO token_transactions(user_id, amount, workoutId) values (?, ?, ?)'

          db.run(query, [userId, tokenCost, workoutId], (err) => {
            if (err) {
              console.log('Error adding to token transaction table')
            } else {
              // Update user token count
              let query = `UPDATE users SET tokens = tokens - (?) WHERE id = (?)`

              db.run(query, [tokenCost, userId], (err) => {
                if (err) {
                  console.log('Error updating the user token count')
                } else {
                  return res.status(200).send({
                    status: 'success',
                    message: 'Data successfully added to the DB',
                  })
                }
              })
            }
          })
        }
      }
    )
  } catch (err) {
    res.status(500).json({
      status: 'failed',
      message: err,
    })
  }
}

const getAllWorkouts = (req, res) => {
  const userId = req.params.id

  let query = 'select * from workouts where userId = (?);'

  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        status: 'failed',
        message: err,
      })
    } else {
      if (!rows) {
        return res.status(404).json({
          status: 'failed',
          message: 'Could not find a workout with that id',
        })
      } else {
        res.status(200).send(rows)
      }
    }
  })
}

//gets the current workout program selected by the user
const getCurrentWorkoutPhase = (req, res) => {
  let userId = req.params.id

  let query =
    'select programName, phase from workouts where userId = (?) and isCurrent = 1'

  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        status: 'failed',
        message: err,
      })
    } else {
      if (!rows) {
        return res.status(404).json({
          status: 'failed',
          message: 'Could not find a workout with that id',
        })
      } else {
        res.status(200).send(rows)
      }
    }
  })
}

const getCurrentProgram = (req, res) => {
  let userId = req.params.id

  let query =
    'Select program from workouts where userId = (?) and isCurrent = 1'

  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        status: 'failed',
        message: err,
      })
    } else {
      if (!rows) {
        return res.status(404).json({
          status: 'failed',
          message: 'Could not find a workout with that id',
        })
      } else {
        res.status(200).send(rows)
      }
    }
  })
}

const setCurrentProgram = (req, res) => {
  const workoutId = req.params.workoutId
  const userId = req.params.userId

  console.log(userId)

  const updateQuery = 'UPDATE workouts set isCurrent = 0 where userId = (?)'

  db.run(updateQuery, [userId], (err) => {
    if (err) {
      return res.status(500).json({
        status: 'failed',
        message: 'Internal service error',
      })
    }

    const setCurrentQuery =
      'UPDATE workouts set isCurrent = 1 where workoutId = (?) and userId = (?)'

    db.run(setCurrentQuery, [workoutId, userId], (err) => {
      if (err) {
        return res.status(500).json({
          status: 'failed',
          message: 'Internal service error',
        })
      } else {
        return res.status(200).json({
          status: 'success',
          message: 'Current workout successfully changed',
        })
      }
    })
  })
}

const getNumberofPhases = (req, res) => {
  db.get(
    'select programDuration from workouts where isCurrent = 1',
    (err, row) => {
      if (err) {
        return res.status(500).json({
          status: 'failed',
          message: 'Internal service error',
        })
      }

      if (!row) {
        return res.status(404).json({
          status: 'failed',
          message: 'User does not have a current workout',
        })
      }

      return res.status(200).send(row)
    }
  )
}

const getWorkoutTutorialData = (req, res) => {
  let { title = '', category = '', page = 1, limit = 6 } = req.query
  const offset = (page - 1) * limit

  title = title.trim().toLowerCase()
  category = category.trim().toLowerCase()

  const countQuery = `
SELECT COUNT(*) AS total FROM tutorials
WHERE LOWER(title) LIKE ? || '%'
  AND LOWER(category) LIKE ? || '%'
`

  const query = `
SELECT * FROM tutorials
WHERE LOWER(title) LIKE ? || '%'
AND LOWER(category) LIKE ? || '%'
LIMIT ? OFFSET ?

`
  db.get(countQuery, [title, category], (err, countResult) => {
    if (err) {
      return res.status(500).json({
        status: 'failed',
        message: 'Internal service error',
      })
    }
    db.all(query, [title, category, limit, offset], (err, rows) => {
      if (err) {
        return res.status(500).json({
          status: 'failed',
          message: 'Internal service error',
        })
      } else {
        return res.status(200).json({
          total: countResult.total,
          page: Number(page),
          limit: Number(limit),
          count: rows.length,
          data: rows,
        })
      }
    })
  })
}

module.exports = {
  generateWorkout,
  getAllWorkouts,
  getCurrentWorkoutPhase,
  getCurrentProgram,
  setCurrentProgram,
  getNumberofPhases,
  getWorkoutTutorialData,
}
