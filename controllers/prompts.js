require('dotenv').config({ path: '../.env' })
const axios = require('axios')

const generatePrompt = (userData, phaseFocus, phaseNumber) => {
  let numExercises
  if (userData.timeLimit == 60) {
    numExercises = '5+ exercises'
  } else {
    numExercises = '7+ exercises'
  }

  let prompt = ''
  let focusNote = ''

  phaseFocus = phaseFocus.toLowerCase()

  console.log(phaseFocus)

  //Additional Changes for the Strength Prompt

  if (phaseFocus === 'strength') {
    if (userData.workoutsPerWeek == 3) {
      focusNote =
        'Provide 1 upper body strength day, 1 lower body strength day and 1 full body strength day. On leg days, superset each main lift with an explosive superset. Max 2 squat exercises and max 1 deadlift exercise'
    } else if (userData.workoutsPerWeek == 4) {
      focusNote =
        'Upper body pull day 1, lower body quad dominant day 2, upper body push day 3 and lower body posterior chain day 4. Max 2 squat exercises and max 1 deadlift exercise **deadlift cannot be a superset with romanian deadlift'
    } else {
      focusNote =
        'Upper body pull day 1, lower body quad dominant day 2, day 3 is core and mobility, upper body push day 4 and lower body posterior chain day 5. On leg days, superset each main lift with an explosive superset. Max 2 squat exercises and max 1 deadlift exercise **deadlift cannot be a superset with romanian deadlift'
    }
  }
  //Additional Changes for the Power Prompt
  else if (phaseFocus === 'power') {
    if (userData.workoutsPerWeek == 3) {
      focusNote =
        'Provide 1 upper body power day, 1 lower body power day and 1 full body power day. On leg days.'
    } else if (userData.workoutsPerWeek == 4) {
      focusNote =
        'Upper body pull day 1, lower body quad dominant day 2, upper body push day 3 and lower body posterior chain day 4. '
    } else {
      focusNote =
        'Upper body pull day 1, lower body quad dominant day 2, day 3 is core and mobility, upper body push day 4 and lower body posterior chain day 5.'
    }
  } else if ((phaseFocus = 'speed')) {
    focusNote =
      'Incomporate speed drills with power and conditioning. This is the users last 4 weeks to get ready for the hockey season. Ex: tempo runs, ladder drills, sprints.'
  } else {
    focusNote = ''
  }

  prompt = `
  You are a professional strength coach for hockey players.

  ## Objective
  Generate a 4-week training phase focused on **${phaseFocus}**.
  Each week should have ${userData.workoutsPerWeek} structured workout days.
  Each day must include:
  - A warmup (5+ movements)
  - A main workout (${numExercises} with supersets)
  - A cool down (4+ recovery activities)

  ## Constraints
  - No duplicate exercises in the same week
  - Respect appropriate training balance for age ${userData.age} and skill level ${userData.skillLevel}
  - Only use available equipment: ${userData.availableEquipment} 

  - Label this block with "phase_number": ${phaseNumber}
  - ${focusNote}

  ## Base this workout on this equipment -> ${userData.availableEquipment}, this is a must requirement
  ex: If user puts dumbbells, chin ups CAN'T be in the workout

  ## Additional notes from user to take into account
 - ${userData.notes}

  ## Format
  Follow this example formatting (do not reuse this workout — generate a new one):

  {
    "phase_focus": "${phaseFocus}",
    "phase_number": ${phaseNumber},
    "phase_description":""phase_description": "Provide a clear, practical coaching description of what the athlete should focus on during this phase. 
Base the description on the phase focus '${phaseFocus}', and include *specific training intent* such as (minimum 400 characters):

- For 'Strength': Focus on lifting as heavy as possible with good technique and full rest between sets.
- For 'Power': Move each rep as fast and explosively as possible with intent.
- For 'Speed': Prioritize maximum velocity and quick ground contact times; all movements should be fast and crisp.
- For 'Cardio': Emphasize sustained effort, efficient breathing, and maintaining pace; focus on heart rate zones and aerobic capacity.

Keep the language goal-driven, brief, and easy to understand for the athlete."
"
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
  } `

  return prompt
}

async function getWorkoutFromPrompt(userData, apiKey) {
  const {
    age,
    skillLevel,
    programName,
    availableEquipment,
    programDuration,
    workoutsPerWeek,
    timeLimit,
    improvements,
    notes,
  } = userData
  let arrTokenCost = [15, 30, 45]

  console.log(programName)

  let tokenCost = 0
  let phaseNames = []

  if (programDuration === 4) {
    tokenCost = arrTokenCost[0]
    phaseNames = [improvements]
  } else if (programDuration === 8) {
    tokenCost = arrTokenCost[1]
    phaseNames = ['Strength', 'Power']
  } else if (programDuration === 12) {
    tokenCost = arrTokenCost[2]
    phaseNames = ['Strength', 'Power', 'Speed']
  }

  const allPhases = []

  for (let i = 0; i < phaseNames.length; i++) {
    const phaseFocus = phaseNames[i]

    const phaseNumber = i + 1

    let prompt = generatePrompt(userData, phaseFocus, phaseNumber)

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
      programName: String(programName),
      duration: `${programDuration} weeks`,
      focus: Array.isArray(phaseNames) ? phaseNames : [],
      workoutsPerWeek: Number(workoutsPerWeek),
      durationPerWorkout: `${timeLimit} mins`,
      equipmentRequired: Array.isArray(availableEquipment)
        ? availableEquipment
        : [],
    },
    phases: Array.isArray(allPhases) ? allPhases : [],
  }

  return {
    programSerialize: JSON.stringify(workout.program),
    phaseSerialize: JSON.stringify(workout.phases),
    tokenCost,
  }
}

module.exports = { getWorkoutFromPrompt }
