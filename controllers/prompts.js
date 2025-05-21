require('dotenv').config({ path: '../.env' })
const axios = require('axios')

async function getWorkoutFromPrompt(userData, apiKey) {
  const {
    age,
    skillLevel,
    availableEquipment,
    programDuration,
    workoutsPerWeek,
    timeLimit,
    improvements,
  } = userData

  console.log(improvements)

  let repeat = 0
  let phaseTarget = ''
  let tokenCost = 0

  if (programDuration == 4) {
    tokenCost = 15
    repeat = 1
    phaseTarget = `Create 1 phase that focuses on ${improvements}`
  }

  const prompt = `
Key requirements:
- Each day includes warmup, main workout, and cool down.
- No duplicate exercises in the same week.
- The formatted workout is just an example for the formatting and doesn't have to be that workout
- ${phaseTarget}
-Include at least 5 warmup exercises
- Must have ${workoutsPerWeek} days of workouts
- Workout is based on ${improvements}
- Include superset formatting, ex: 1A, 1B, 2A, 2B, 3A, 3B
- Must have 6 exercises for the main lift



Constraints:
- Age: ${age}, Skill level: ${skillLevel}, Equipment: ${availableEquipment}
- Duration: ${programDuration} weeks, ${workoutsPerWeek} workouts/week, ${timeLimit} mins/workout

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
              "Single-leg balance with reach, 2x8/leg",
              "Single leg glute bridge, 3x10/leg",

            ],
            "main_workout": [
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
    temperature: 0.7,
  }

  const url = 'https://api.openai.com/v1/chat/completions'

  try {
    const response = await axios.post(url, requestBody, { headers })
    const result = response.data.choices[0].message.content

    const tokensUsed = response.data.usage.total_tokens
    console.log('Tokens used:', tokensUsed)

    const cleanResult = result.replace(/```json\s*/g, '').replace(/```/g, '')

    const workout = JSON.parse(cleanResult)

    const programSerialize = JSON.stringify(workout.program)
    const phaseSerialize = JSON.stringify(workout.phases)

    return {
      programSerialize,
      phaseSerialize,
      tokenCost,
    }
  } catch (error) {
    console.error('Error fetching workout:', error.message)
    throw error
  }
}

module.exports = { getWorkoutFromPrompt }
