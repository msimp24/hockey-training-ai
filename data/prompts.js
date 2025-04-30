function getPrompts(
  age,
  skillLevel,
  availableEquipment,
  programDuration,
  workoutsPerWeek,
  timeLimit,
  improvements
) {
  let prompt

  if (programDuration == 4) {
    prompt = `
   Key requirements:
- Each day includes warmup, main workout, and cool down.
- No duplicate exercises in the same week.
- The formatted workout is just an example for the formatting and doesn't have to be that workout
- Create 1 phase that focuses on ${improvements}
- Include at least 5 warmup exercises
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
  }
}

module.exports = { getPrompts }
