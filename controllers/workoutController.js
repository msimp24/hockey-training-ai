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
          let query = `SELECT workoutId 
            FROM workouts 
            WHERE userId = (?)
            order by workoutId limit 1`

          db.get(query, [userId], (err, row) => {
            if (err) {
              console.log('Could not find a workout with that ')
            } else {
              let query =
                'INSERT INTO token_transactions(user_id, amount, workoutId) values (?, ?, ?)'

              let workoutId = row.workoutId

              db.run(query, [userId, tokenCost, workoutId], (err) => {
                if (err) {
                  console.log('Error adding to token transaction table')
                } else {
                  //update user token count

                  let query = `update users set tokens = tokens - (?)`

                  db.run(query, [tokenCost], (err) => {
                    if (err) {
                      console.log('Error updating the user token count')
                    } else {
                      return res.status(200).send({
                        status: 'success',
                        message: 'data successfully added to the DB',
                      })
                    }
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

  const updateQuery = 'UPDATE workouts set isCurrent = 0'

  db.run(updateQuery, (err) => {
    if (err) {
      return res.status(500).json({
        status: 'failed',
        message: 'Internal service error',
      })
    }

    const setCurrentQuery =
      'UPDATE workouts set isCurrent = 1 where workoutId = (?)'

    db.run(setCurrentQuery, [workoutId], (err) => {
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
  let { title = '', category = '' } = req.query

  title = title.trim().toLowerCase()
  category = category.trim().toLowerCase()

  const query = `
    SELECT * FROM tutorials
    WHERE LOWER(title) LIKE '%' || ? || '%'
      AND LOWER(category) LIKE '%' || ? || '%'
  `

  db.all(query, [title, category], (err, rows) => {
    if (err) {
      return res.status(500).json({
        status: 'failed',
        message: 'Internal service error',
      })
    } else {
      return res.status(200).json(rows)
    }
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
