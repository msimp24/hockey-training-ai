require('dotenv').config()
const db = require('../config/db')
const axios = require('axios')
const { getPrompts } = require('../data/prompts.js')

const apiKey = process.env.GPT_SECRET_KEY

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

  let test = getPrompts(
    age,
    skillLevel,
    availableEquipment,
    programDuration,
    workoutsPerWeek,
    timeLimit,
    improvements
  )

  console.log(test)

  let repeat = 0
  let phaseTarget = ''
  let tokenCost = 0

  if (programDuration == 4) {
    tokenCost = 15
    repeat = 1
    phaseTarget = `Create 1 phase that focuses on ${improvements}`
  } else if (programDuration == 8) {
    tokenCost = 30
    repeat = 2
    phaseTarget = `Create 2 seperate phases that focus on strength and power`
    improvements = 'Strength, Power'
  } else if (programDuration == 12) {
    tokenCost = 45
    repeat = 3
    improvements = 'Strength, Power, Speed'
  }

  const prompt = `
Key requirements:
- Each day includes warmup, main workout, and cool down.
- No duplicate exercises in the same week.
- The formatted workout is just an example for the formatting and doesn't have to be that workout
- ${phaseTarget}
-Include at least 5 warmup exercises
- Must have ${workoutsPerWeek} days of workouts
- Format workout is an example and can be changed for different ${improvements}


Constraints:
- Age: ${age}, Skill level: ${skillLevel}, Equipment: ${availableEquipment}
- Duration: ${programDuration} weeks, ${workoutsPerWeek} workouts/week, ${timeLimit} mins/workout
- Focus: ${improvements || 'Provide a suitable focus if unspecified'}

Format:
{
  "program": {
    "duration": "${programDuration} weeks (repeat ${
    programDuration / repeat
  } times)",
    "focus": [${improvements}],
    "workoutsPerWeek": ${workoutsPerWeek},
    "durationPerWorkout": "${timeLimit} mins",
    "equipmentRequired": ${availableEquipment}"
  },
  "phases": [
    {
      "phase_focus": "${improvements}",
      "phase_number": 1,
      "weekly_schedule": [
        {
            "day":1,
            "focus": "Lower Body Strength",
            "warmup": [
              "5 mins bike for 5 mins",
              "Dynamic lunges, 2x10/leg",
              "Hip flexor stretch, 2x30s/leg",
              "Single-leg balance with reach, 2x8/leg"
            ],
            "main_workout": [
            /* example lift */
              "1A Back Squat, 4x8 @ 80-85% 1RM",
              "1B Romanian Deadlift, 4x6",
              "2A Bulgarian Split Squat, 4x8/leg",
              "2B Single leg glute bridge, 3x10/leg",
              "3A Calf Raises, 4x15",
              "3B Nordic Hamstring Curls, 3x6"
            ],
            "cool_down": [
              "Foam rolling for 10 mins",
              "Hip flexor stretch, 2x30s/leg",
              "Hamstring stretch, 2x30s/leg"
            ]
          }
        }
      ]
    }
  ]
}
`

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  const requestBody = {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a professional strength coach for hockey players.',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 4000,
    temperature: 0.7, // Controls the randomness of the output
  }
  const url = 'https://api.openai.com/v1/chat/completions'

  try {
    const response = await axios.post(url, requestBody, { headers })
    const result = response.data.choices[0].message.content

    const tokensUsed = response.data.usage.total_tokens
    console.log('Tokens used:', tokensUsed)

    const workout = JSON.parse(result)

    const programSerialize = JSON.stringify(workout.program)
    const phaseSerialize = JSON.stringify(workout.phases)

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

module.exports = {
  generateWorkout,
  getAllWorkouts,
  getCurrentWorkoutPhase,
  getCurrentProgram,
  setCurrentProgram,
  getNumberofPhases,
}
