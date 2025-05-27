import {
  checkAuth,
  logout,
  fetchUserData,
  fetchData,
  fetchUserTokens,
} from './utils/utilities.js'
import {
  createNotEnoughTokens,
  createWorkoutFormHtml,
} from './utils/createWorkoutForm.js'

const http =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000/'
    : 'https://hockey-training-ai.com/'

document.addEventListener('DOMContentLoaded', async () => {
  //navbar change active link clicked

  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', function () {
      // Remove 'active' from all links
      document
        .querySelectorAll('.nav-link')
        .forEach((l) => l.classList.remove('active'))
      // Add 'active' to the clicked one
      this.classList.add('active')
    })
  })

  document.querySelectorAll('.nav-link').forEach((link) => {
    if (link.getAttribute('href') === window.location.pathname) {
      link.classList.add('active')
    }
  })

  const currentLocation = window.location.pathname
  const authData = await checkAuth()

  const logoutBtn = document.querySelector('#logout-btn')
  const currUser = document.querySelector('#curr-user')

  logoutBtn.addEventListener('click', logout)
  const userData = await fetchUserData(authData.userId)

  if (authData.loggedIn) {
    currUser.textContent = `Hello, ${userData.firstName}`
  } else {
    window.location.href = '/login'
  }

  //handles functionality for the home dashboard page

  if (currentLocation === '/dashboard') {
    if (authData.loggedIn) {
      // gets the name of the user that is logged in

      //get the number of phases for the current workout

      try {
        const response = await fetch(`${http}workout/get-num-phases`, {
          credentials: 'include',
        })

        const workoutsResponse = await fetch(
          `${http}workout/program/${authData.userId}`,
          {
            credentials: 'include',
          }
        )

        const programs = await workoutsResponse.json()

        if (programs.length != 0) {
          const phaseContainer = document.querySelector('.phase-container')
          phaseContainer.style.display = 'flex'

          const json = await response.json()

          let numberOfPhases = json.programDuration / 4

          const phaseSelect = document.querySelector('#phase-select')
          for (let i = 0; i < numberOfPhases; i++) {
            let option = document.createElement('option')
            option.value = i
            option.textContent = 'Phase ' + (i + 1)
            phaseSelect.append(option)
          }

          phaseSelect.addEventListener('change', function () {
            //creates the workout cards and displays them on the dashboard page
            //generates workout selected by the user

            getCurrentWorkoutPhase(authData.userId, this.value)
          })
        }
      } catch (err) {
        console.error(err)
      }

      //displays initial workout so the user does not have to display every time

      getCurrentWorkoutPhase(authData.userId, 0)

      //creates program summary of the workout

      createProgramSummary(authData.userId)
    } else {
      window.location.href = '/login'
    }
  }

  if (currentLocation === '/dashboard/create-workout') {
    //form selectors and handling form errors and submit

    //modal selector for the create workout form
    const createWorkoutModal = document.querySelector('.modal-overlay')

    //creates a new workout form modal for user to generate workout phase
    const createWorkoutForm = document.createElement('div')

    //directs user to the add tokens page from create workout page
    const addTokensBtn = document.querySelector('#add-tokens-btn')

    //selects user tokens
    const userTokenH1 = document.querySelector('#user-tokens')
    let data = await fetchUserTokens(
      `${http}payments/get-tokens`,
      authData.userId
    )
    userTokenH1.textContent = 'Tokens: ' + data.tokens

    addTokensBtn.addEventListener('click', () => {
      window.location.href = '/dashboard/buy-tokens'
    })

    document.querySelectorAll('.purchase-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.id)

        //checks if user has enough tokens to buy the workout, if not, direct user to the purchase tokens page

        //may look into adding getting these values from the database for future functionality
        let workoutCost

        if (id == 1) {
          workoutCost = 15
        }
        if (id == 2) {
          workoutCost = 30
        }
        if (id == 3) {
          workoutCost = 45
        }

        //if users token count is less than the cost of a workout, then a modal appears to guide the user to buy more tokens or cancel
        if (data.tokens < workoutCost) {
          createWorkoutForm.innerHTML = createNotEnoughTokens()
          createWorkoutModal.append(createWorkoutForm)
          createWorkoutModal.style.display = 'flex'

          const purchaseMoreTokens = document.querySelector(
            '#purchase-more-tokens'
          )
          const cancelMoreTokens = document.querySelector('#cancel-more-tokens')

          purchaseMoreTokens.addEventListener('click', () => {
            window.location.href = '/dashboard/buy-tokens'
          })
          cancelMoreTokens.addEventListener('click', () => {
            createWorkoutModal.style.cssText = `
          display:'flex'
          `
          })
        } else {
          createWorkoutForm.innerHTML = createWorkoutFormHtml(id)

          createWorkoutModal.append(createWorkoutForm)
          createWorkoutModal.style.display = 'flex'

          const modalCloseBtn = document.querySelector('.close-modal-btn')
          modalCloseBtn.addEventListener('click', () => {
            createWorkoutModal.style.cssText = `
          display:'flex'
          `
          })

          const generateWorkoutForm = document.querySelector(
            '#generate-workout-form'
          )

          //input selectors and error selectors
          const programNameInput = document.querySelector('#program-name-input')
          const programNameErr = document.querySelector('#name-err')

          const ageInput = document.querySelector('#age-input')
          const ageErr = document.querySelector('#age-err')

          const skillInput = document.querySelector('#skill-input')
          const skillErr = document.querySelector('#skill-err')

          const phaseInput = document.querySelector('#phase-input')
          const phaseErr = document.querySelector('#phase-err')

          const numWorkoutsInput = document.querySelector('#num-workouts-input')
          const numWorkoutsErr = document.querySelector('#num-workouts-err')

          const workoutTimeInput = document.querySelector('#workout-time-input')
          const workoutTimeErr = document.querySelector('#workout-time-err')

          const focusInput = document.querySelector('#focus-input')
          const focusErr = document.querySelector('#focus-err')

          const equipmentErr = document.querySelector('#equipment-err')

          generateWorkoutForm.addEventListener('submit', (e) => {
            e.preventDefault()

            let isValid = true

            let workoutForm = {}
            workoutForm.userId = authData.userId
            workoutForm.programDuration = Number(phaseInput.value)

            if (!programNameInput.value) {
              programNameErr.textContent = 'This is a required field'
              isValid = false
            } else {
              programNameErr.textContent = ''
              workoutForm.programName = programNameInput.value
            }

            if (!ageInput.value) {
              ageErr.textContent = 'Age is a required field'
              isValid = false
            } else {
              if (!Number.isInteger(Number(ageInput.value))) {
                ageErr.textContent = 'Age must be a number'
                isValid = false
              } else {
                ageErr.textContent = ''
                workoutForm.age = Number(ageInput.value)
              }
            }

            if (skillInput.value === 'Select') {
              skillErr.textContent = 'Skill level is a required field'
              isValid = false
            } else {
              skillErr.textContent = ''
              workoutForm.skillLevel = skillInput.value
            }

            if (numWorkoutsInput.value === 'Select') {
              numWorkoutsErr.textContent =
                'Selecting the number of workouts is a required field'
              isValid = false
            } else {
              numWorkoutsErr.textContent = ''
              workoutForm.workoutsPerWeek = Number(numWorkoutsInput.value)
            }

            if (workoutTimeInput.value === 'Select') {
              workoutTimeErr.textContent =
                'Selecting a workout time is a required field'
              isValid = false
            } else {
              workoutTimeErr.textContent = ''
              workoutForm.timeLimit = Number(workoutTimeInput.value)
            }

            if (
              focusInput &&
              focusInput.value !== null &&
              focusInput.value !== undefined
            ) {
              if (focusInput.value === 'Select') {
                focusErr.textContent =
                  'Selecting a workout phase is a required field'
                isValid = false
              } else {
                focusErr.textContent = ''
                workoutForm.improvements = focusInput.value
              }
            }
            // Collect selected equipment options and join them into a string (comma-separated)
            const selectedEquipment = Array.from(
              document.querySelectorAll('#equipment-checkbox input:checked')
            )
              .map((checkbox) => checkbox.value) // Get the value of each checked checkbox
              .join(',') // Join the values into a single string

            if (!selectedEquipment) {
              equipmentErr.textContent =
                'Please select at least one equipment option.'
              isValid = false
            } else {
              equipmentErr.textContent = ''
              workoutForm.availableEquipment = selectedEquipment // Save as a string
            }

            if (isValid) {
              console.log(workoutForm)
              generateWorkout(workoutForm, `${http}workout/generate`)
            }
          })
        }
      })
    })
  }

  // if location is at the all workouts page
  if (currentLocation === '/dashboard/all-workouts') {
    const data = await fetchData(
      `${http}workout/get-all-workouts/${authData.userId}`
    )
    const allWorkoutsGrid = document.querySelector('.all-workout-grid')

    data.forEach((el) => {
      let card = document.createElement('div')
      card.innerHTML = createAllWorkoutsCard(el)
      allWorkoutsGrid.append(card)
    })
    document.querySelectorAll('button[data-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const workoutId = button.dataset.id
        //add user id to set the current workout of the user that is currently logged in
        setCurrentWorkout(workoutId, userData.id)
      })
    })
  }

  if (currentLocation === '/dashboard/buy-tokens') {
    //gets data of the user that is logged in
    const userData = await fetchUserData(authData.userId)
    const userEmail = document.querySelector('#curr-email')

    //selects user tokens
    const userTokenH2 = document.querySelector('#user-tokens-2')
    let json = await fetchUserTokens(
      `${http}payments/get-tokens`,
      authData.userId
    )
    userTokenH2.textContent = 'Tokens: ' + json.tokens

    const data = await fetchData(`${http}payments/get-price-data`)

    const pricingCardContainer = document.querySelector(
      '.pricing-card-container'
    )

    data.forEach((el) => {
      let card = document.createElement('div')
      card.innerHTML = createPricingCard(el)
      pricingCardContainer.append(card)
    })

    document.querySelectorAll('.token-btn').forEach((button) => {
      button.addEventListener('click', async (event) => {
        const cardId = event.target.getAttribute('date-id')
        let id = Number(cardId)
        console.log(authData.userId)

        try {
          const response = await fetch(
            `${http}payments/create-payment-session`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: id,
                userId: authData.userId,
              }),
            }
          )

          if (!response.ok) {
            // Parse the JSON response to get the message
            const errorData = await response.json()
          } else {
            // Redirect to login if registration is successful
            const json = await response.json()

            window.location.href = json.url
          }
        } catch (error) {
          // Log any error
          console.error(error)
        }
      })
    })
  }

  if (currentLocation === '/dashboard/how-to-videos') {
    const videoGrid = document.querySelector('.video-grid')
    const tutorialSearch = document.querySelector('#tutorial-search')
    const paginationWrapper = document.querySelector('.pagination-wrapper')

    let debounceTimeout

    const LIMIT = 9

    async function loadTutorials(query = '', page = 1) {
      videoGrid.innerHTML = ''
      paginationWrapper.innerHTML = ''

      const url = `${http}workout/workout-tutorials/?title=${query}&limit=${LIMIT}&page=${page}`

      const tutorials = await fetchData(url)

      tutorials.data.forEach((el) => {
        const card = document.createElement('div')
        card.innerHTML = createVideoCard(el.image_url, el.title, el.url)
        videoGrid.append(card)
      })

      createPaginationBtns(tutorials.total, LIMIT, query, page)
    }

    tutorialSearch.addEventListener('input', () => {
      clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(() => {
        const query = tutorialSearch.value.trim().toLowerCase()
        loadTutorials(query)
      }, 600)
    })
    loadTutorials()

    function createPaginationBtns(
      totalItems,
      limit,
      query = '',
      currentPage = 1
    ) {
      const pageCount = Math.ceil(totalItems / limit)
      paginationWrapper.innerHTML = '' // Clear old buttons

      for (let i = 0; i < pageCount; i++) {
        const pageNum = i + 1
        const btn = document.createElement('div')
        btn.classList.add('pagination-button')
        btn.textContent = pageNum

        if (pageNum === currentPage) {
          btn.classList.add('active')
        }

        btn.addEventListener('click', () => {
          loadTutorials(query, pageNum)
        })

        paginationWrapper.append(btn)
      }
    }

    function createVideoCard(imgUrl, title, videoUrl) {
      let html = `
      <a href="${videoUrl}" target="_blank">
        <div>
          <img
          src="${imgUrl}"
          alt="${title}" />
          <h2 class="video-h2">${title}</h2>
        </div>
      </a>  
      `
      return html
    }
  }
})

const getCurrentWorkoutPhase = async (userId, phase) => {
  try {
    const response = await fetch(`${http}workout/get-current-phase/${userId}`, {
      credentials: 'include',
    })
    const workoutsGrid = document.querySelector('.workouts-grid')

    const workouts = await response.json()
    const workoutName = workouts[0].programName

    //changes name of the current workout selected
    const workoutNameSelector = document.querySelector('#current-workout-name')
    workoutNameSelector.textContent = workoutName

    //

    let phases = JSON.parse(workouts[0].phase)

    const phaseFocus = document.querySelector('#phase-focus-header')

    phaseFocus.innerHTML = ` <h2 class="h2-dashboard" id="phase-focus-header">Phase focus - ${phases[phase].phase_focus}</h2>
    <br>
    <h2 class="h2-dashboard">Repeat phase for 4 weeks</h2>
    `

    let workoutArray = phases[phase].weekly_schedule

    workoutsGrid.innerHTML = ''

    workoutArray.forEach((workout) => {
      let card = createWorkoutCard(workout)
      workoutsGrid.append(card)
    })
  } catch (err) {
    console.error('There was an error fetching data:' + err)
  }
}

//Creates program summary on the dashboard page based on the users current workout plan
const createProgramSummary = async (userId) => {
  const response = await fetch(`${http}workout/program/${userId}`, {
    credentials: 'include',
  })
  const programCard = document.createElement('div')
  programCard.classList.add('program-card')
  const workoutWrapper = document.querySelector('#workout-wrapper')

  let program = await response.json()

  if (program.length == 0) {
    const createWorkoutBtn = document.createElement('button')
    const noWorkoutsh1 = document.createElement('h2')
    workoutWrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    `

    noWorkoutsh1.textContent = 'Currently no workouts created'

    createWorkoutBtn.textContent = 'Generate Workout'
    createWorkoutBtn.classList.add('create-workout-btn')

    createWorkoutBtn.addEventListener('click', () => {
      window.location.href = '/dashboard/create-workout'
    })

    workoutWrapper.append(noWorkoutsh1)
    workoutWrapper.append(createWorkoutBtn)
  } else {
    program = JSON.parse(program[0].program)
    programCard.innerHTML = `
          <h2>Program Summary</h2>
            <hr />
            <div>
              <p class="title">Duration:</p>
              <p class="desc">${program.duration}</p>
            </div>
            <div>
              <p class="title">Est. Duration per Workout:</p>
              <p class="desc">${program.durationPerWorkout}</p>
            </div>
            <div>
              <p class="title">Focus:</p>
              <p class="desc">${program.focus.toString()}</p>
            </div>
            <div>
              <p class="title">Workouts per week:</p>
              <p class="desc">${program.workoutsPerWeek}</p>
            </div>

            <div>
              <p class="title">Equipment Requirements:</p>
              <p class="desc">${program.equipmentRequired}</p>
            </div>
          
  `

    workoutWrapper.append(programCard)
    workoutWrapper.style.cssText = `
    display:block;
    `
  }
}

//Create workout card
const createWorkoutCard = (workout, index) => {
  let card = ''

  let warmupHtml = ''
  workout.warmup.forEach((el) => {
    let arr = el.split(',')
    warmupHtml += `
          <div class="exercises-container">
            <p class="exercise-name">${arr[0]}</p>
            <p class="reps-name">${arr[1] || '-'}</p>
          </div>
      `
  })

  let mainWorkout = ''
  workout.main_workout.forEach((el) => {
    let arr = el.split(',')
    mainWorkout += `
          <div class="exercises-container">
            <p class="exercise-name">${arr[0]}</p>
            <p class="reps-name">${arr[1] || '-'}</p>
          </div>
      `
  })

  let coolDown = ''
  workout.cool_down.forEach((el) => {
    let arr = el.split(',')
    coolDown += `
          <div class="exercises-container">
            <p class="exercise-name">${arr[0]}</p>
            <p class="reps-name">${arr[1] || '-'}</p>
          </div>
      `
  })
  card = `
    <div class="workout-card">
          <h1>Day ${workout.day} - ${workout.focus}</h1>
          <hr />
          <div class="headers">
            <h3>Exercise</h3>
            <h3>Sets/Reps</h3>
          </div>
          <h2>Warm Up</h2>
          ${warmupHtml}
          <hr />
          <h2>Main Workout</h2>
          ${mainWorkout}
          <hr />
          <h2>Cool Down</h2>
          ${coolDown}
        </div>
    
    `

  const cardDiv = document.createElement('div')
  cardDiv.innerHTML = card

  return cardDiv
}

//Create workout page on the dashboard

//generate new workout
const generateWorkout = async (data, url) => {
  const generateWorkoutBtn = document.querySelector('#generate-workout-btn')

  let loader = document.createElement('div')
  loader.classList.add('loader')

  generateWorkoutBtn.disabled = true
  generateWorkoutBtn.innerHTML = ''
  generateWorkoutBtn.textContent = 'Generating Program..'
  generateWorkoutBtn.append(loader)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: Something went wrong.`

      // Attempt to extract JSON error details if possible
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
        console.log(errorMessage)
      } catch {
        console.warn('Could not parse error response as JSON.')
      }

      // Display error message to user

      // Re-enable the button for retry
      generateWorkoutBtn.disabled = false
      generateWorkoutBtn.innerHTML = 'Generate Workout'
      return
    }

    // Successful response
    window.location.href = '/dashboard/all-workouts'
  } catch (error) {
    console.error('Network error or unexpected issue:', error)
    alert('Failed to connect to the server. Please try again later.')

    // Re-enable the button for retry
    generateWorkoutBtn.disabled = false
    generateWorkoutBtn.innerHTML = 'Generate Workout'
  }
}

const createAllWorkoutsCard = (workout) => {
  let card = `
     <div class="all-workout-card">
        <h2>${workout.programName}</h2>
        <p><span>Focus</span> - ${workout.improvements}</p>
        <p><span>Program duration</span> - ${workout.programDuration} weeks</p>

        <p><span>Equipment Needed</span> - ${workout.availableEquipment}</p>
        <p><span>Skill Level</span> - ${workout.skillLevel}</p>
        <p><span>Workouts per Week</span> - ${workout.workoutsPerWeek}</p>
        <p><span>Length of workouts</span> - ${workout.timeLimit} mins</p>

        <div class="btn-container">
          <button data-id=${workout.workoutId}>Set Current Program</button>
        </div>
      </div>
  `
  return card
}

const setCurrentWorkout = async (workoutId, userId) => {
  try {
    const response = await fetch(
      `${http}workout/set-current-workout/${workoutId}/${userId}`,
      {
        method: 'PUT',
        credentials: 'include',
      }
    )

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: Something went wrong.`

      // Attempt to extract JSON error details if possible
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch {
        console.warn('Could not parse error response as JSON.')
      }

      // Display error message to user
      alert(errorMessage)
    }
    window.location.href = '/dashboard'
  } catch (err) {
    console.err(err)
  }
}

const createPricingCard = (card) => {
  let temp = ''
  if (card.id == 2) {
    temp = 'Enough for 1 workout phase (4 weeks)'
  }
  if (card.id == 3) {
    temp = 'Enough for 2 workout phases (8 weeks)'
  }
  if (card.id == 4) {
    temp = 'Enough for 3 workout phases (12 weeks)'
  }
  let price = (Math.round(Number(card.price_per_token) * 100) / 100).toFixed(2)

  let pricingCard = `
  <div class="pricing-card">
        <h2>${card.package_name}</h2>
        <p class="price">$${card.price}</p>
        <ul>
          <li>Token value - $${price}</li>
          <li>${card.token_amount} tokens</li>
          <li>${temp}</li>
        </ul>
        <button date-id=${card.id} class="token-btn">Buy Tokens</button>
  </div>
`
  return pricingCard
}

const postBuyTokens = (id) => {}
