require('dotenv').config({ path: '../.env' })
const axios = require('axios')

const generatePrompt = (userData) => {}

async function getWorkoutFromPrompt(userData, apiKey) {
  const {
    age,
    skillLevel,
    availableEquipment,
    programDuration,
    workoutsPerWeek,
    timeLimit,
    improvements,
    notes,
  } = userData

  let tokenCost = 0
  let phaseNames = []

  if (programDuration === 4) {
    tokenCost = 15
    phaseNames = [improvements]
  } else if (programDuration === 8) {
    tokenCost = 30
    phaseNames = [
      'Strength',
      improvements.toLowerCase().includes('speed') ? 'Speed' : 'Power',
    ]
  } else if (programDuration === 12) {
    tokenCost = 45
    phaseNames = ['Strength', 'Power', 'Speed']
  }

  const allPhases = []

  for (let i = 0; i < phaseNames.length; i++) {
    const phaseFocus = phaseNames[i]
    const phaseNumber = i + 1

    const prompt = `
You are a professional strength coach for hockey players.

## Objective
Generate a 4-week training phase focused on **${phaseFocus}**.
Each week should have ${workoutsPerWeek} structured workout days.
Each day must include:
- A warmup (5+ movements)
- A main workout (6+ exercises or supersets)
- A cool down (3+ recovery activities)

## Constraints
- No duplicate exercises in the same week
- Respect appropriate training balance for age ${age} and skill level ${skillLevel}
- Only use available equipment: ${availableEquipment}
- Each session must fit within ${timeLimit} minutes
- Label this block with "phase_number": ${phaseNumber}

## Additional notes from user to take into account
${notes}

## Format
Follow this example formatting (do not reuse this workout — generate a new one):

{
  "phase_focus": "${phaseFocus}",
  "phase_number": ${phaseNumber},
  "weekly_schedule": [
    {
      "day": 1,
      "focus": "Lower Body Strength",
      "warmup": [
        "5 mins bike",
        "Dynamic lunges, 2x10/leg",
        "Hip flexor stretch, 2x30s/leg",
        "Single-leg balance with reach, 2x8/leg",
        "Single leg glute bridge, 3x10/leg"
      ],
      "main_workout": [
        "1A Back Squat, 4x8 @ 80-85% 1RM",
        "1B Box Jumps, 4x6",
        "2A Romanian Deadlift, 4x8",
        "2B Walking Lunges, 3x12/leg",
        "3A Leg Press, 3x12",
        "3B Plank Hold, 3x45s"
      ],
      "cool_down": [

      ]
    }
    // Add day 2, 3, etc.
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
      max_tokens: 3000,
      temperature: 0.7,
    }

    const url = 'https://api.openai.com/v1/chat/completions'

    try {
      const response = await axios.post(url, requestBody, { headers })
      const rawResult = response.data.choices[0].message.content
      const cleanResult = rawResult
        .replace(/```json\s*/g, '')
        .replace(/```/g, '')
      const parsedPhase = JSON.parse(cleanResult)
      allPhases.push(parsedPhase)
      console.log(
        `Tokens used for phase ${phaseNumber}:`,
        response.data.usage.total_tokens
      )
    } catch (error) {
      console.error(`Error generating phase ${phaseNumber}:`, error.message)
      throw new Error(`Failed to generate phase ${phaseNumber}`)
    }
  }

  const workout = {
    program: {
      duration: `${programDuration} weeks`,
      focus: phaseNames,
      workoutsPerWeek,
      durationPerWorkout: `${timeLimit} mins`,
      equipmentRequired: availableEquipment,
    },
    phases: allPhases,
  }

  return {
    programSerialize: JSON.stringify(workout.program),
    phaseSerialize: JSON.stringify(workout.phases),
    tokenCost,
  }
}

module.exports = { getWorkoutFromPrompt }
