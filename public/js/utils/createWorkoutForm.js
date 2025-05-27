export function createWorkoutFormHtml(phaseNumber) {
  let phaseType
  let programLength

  let programType

  if (phaseNumber === 1) {
    phaseType = '4 week program'
    programLength = 4
    programType = `
          <div class="input-box">
          <label for="focus-type">Choose a progam type</label>
          <select name="focus-type" id="focus-input">
            <option hidden>Select</option>

            <option value="strength">Strength</option>
            <option value="power">Power</option>
            <option value="speed">Speed</option>
            <option value="cardio">Cardio</option>
          </select>
          <p class="error-text" id="focus-err"></p>
        </div>
    `
  } else if (phaseNumber === 2) {
    phaseType = '8 week program'
    programLength = 8
    programType = ''
  } else if (phaseNumber === 3) {
    phaseType = '12 week program'
    programLength = 12
    programType = ''
  } else {
    programLength = 0
  }

  let workoutForm = `
 <form class="prompt-form" id="generate-workout-form">
       <div class="close-modal-btn">&times;</div>
      <h2>Generate AI Program</h2>
      <h2>${phaseType}</h2>
      <div class="input-box">
        <label for="name">Program Name</label>
        <input type="text" name="name" id="program-name-input" />
        <p class="error-text" id="name-err"></p>
      </div>
      <div class="split-box">
        <div class="input-box">
          <label for="age">Age</label>
          <input type="text" name="age" id="age-input" />
          <p class="error-text" id="age-err"></p>
        </div>
        <div class="input-box">
          <label for="skill">Skill Level</label>
          <select type="text" name="skill" id="skill-input">
            <option hidden>Select</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <p class="error-text" id="skill-err"></p>
        </div>
      </div>
       <input type="hidden" id="phase-input" name="phase-input" value="${programLength}" />

        <div class="input-box">
          <label for="num-workouts">Workouts per week (days)</label>
          <select name="num-workouts" id="num-workouts-input">
            <option hidden>Select</option>

            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <p class="error-text" id="num-workouts-err"></p>
        </div>
        <div class="input-box">
          <label for="workout-time">Workout Length (minutes)</label>
          <select name="workout-time" id="workout-time-input">
            <option hidden>Select</option>

            <option value="30">30</option>
            <option value="60">60</option>
            <option value="90">90</option>
          </select>
          <p class="error-text" id="workout-time-err"></p>
        </div>
      </div>
      ${programType}
      <div class="input-box">
        <label>Equipment Available:</label>

        <div class="checkbox-group" id="equipment-checkbox">
          <label class="checkbox-label">
            <input type="checkbox" name="all" value="all" />
            All
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="none" value="no equipment" />
            No Equipment
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="dumbbells" />
            Dumbbells
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="kettlebells" />
            Kettlebells
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="barbell" />
            Barbell + Plates
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="medicine ball" />
            Medicine Ball
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="resistance bands" />
            Resistance Bands
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="weight bench" />
            Weight Bench
          </label>

          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="treadmill" />
            Treadmill
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="stationary bike" />
            Stationary Bike
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="rowing machine" />
            Rowing Machine
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="jump rope" />
            Jump Rope
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="battle ropes" />
            Battle Ropes
          </label>

          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="speed ladder" />
            Speed Ladder
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="agility cones" />
            Agility Cones
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="plyo box" />
            Plyo Box
          </label>
          <label class="checkbox-label">
            <input
              type="checkbox"
              name="equipment"
              value="resistance parachute" />
            Resistance Parachute
          </label>

          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="stability ball" />
            Stability Ball
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="bosu ball" />
            BOSU Ball
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="balance-board" />
            Balance Board
          </label>
          <label class="checkbox-label">
            <input type="checkbox" name="equipment" value="ab wheel" />
            Ab Wheel
          </label>
        </div>
        <p class="error-text" id="equipment-err"></p>
      </div>
      <button id="generate-workout-btn" type="submit">Generate Program</button>
    </form>
 `
  return workoutForm
}

export function createNotEnoughTokens() {
  let card = ``

  card = `
    <div class="purchase-tokens-modal">
      <h1>Oops, not enough tokens in your balance</h1>
      <div>
        <button id="purchase-more-tokens">Purchase Tokens</button>
        <button id="cancel-more-tokens">Cancel</button>
      </div>
    </div>  
`
  return card
}

// creates card on create-workout view that allows user to pick which product they want
export function createProductCard() {
  let card = ''

  card = ``
}
