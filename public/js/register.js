const registerLoginBtn = document.querySelector('#reg-login-btn')

//goes to login page on click
registerLoginBtn.addEventListener('click', () => {
  window.location.href = '/login'
})

const http =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000/'
    : 'https://hockey-training-ai.com'

//selectors for regstration button and form
const registerSubmitBtn = document.getElementById('register-btn')
const registerForm = document.querySelector('#register-form')

//gets DOM elements of the registration form
const firstNameInput = document.getElementById('first-name')
const lastNameInput = document.getElementById('last-name')
const regEmailInput = document.getElementById('reg-email')
const regPasswordInput = document.getElementById('reg-password')
const regConfirmPassword = document.getElementById('reg-confirm-password')

//error DOM elements for registration form
const firstNameErr = document.getElementById('first-name-err')
const lastNameErr = document.getElementById('last-name-err')
const emailErr = document.getElementById('email-err')
const passwordErr = document.getElementById('password-err')
const confirmPassErr = document.getElementById('confirm-pass-err')

//register user post method

const postRegisterData = async (data, url) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      // Parse the JSON response to get the message
      const errorData = await response.json()

      // Show the error message in the confirmPassErr element
      emailErr.textContent = errorData.message

      // Optionally, throw an error for further handling
      throw new Error(
        `Response status: ${response.status} - ${errorData.message}`
      )
    } else {
      // Redirect to login if registration is successful
      window.location.href = '/login'
    }
  } catch (error) {
    // Log any error
    console.error(error)
  }
}

//handles registration form
registerForm.addEventListener('submit', (e) => {
  e.preventDefault()
  let isValid = true

  let user = {}

  if (!firstNameInput.value.trim()) {
    firstNameErr.textContent = 'First name is a required field'
    isValid = false
  } else {
    user.firstName = firstNameInput.value
    firstNameErr.textContent = ''
  }

  if (!lastNameInput.value.trim()) {
    lastNameErr.textContent = 'Last name is a required field'
    isValid = false
  } else {
    user.lastName = lastNameInput.value
    lastNameErr.textContent = ''
  }

  if (!regEmailInput.value.trim()) {
    emailErr.textContent = 'Email is a required field'
    isValid = false
  } else {
    let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!regex.test(regEmailInput.value.trim())) {
      isValid = false
      emailErr.textContent = 'Not a valid email address'
    } else {
      emailErr.textContent = ''
      user.email = regEmailInput.value
    }
  }

  if (!regPasswordInput.value.trim()) {
    passwordErr.textContent = 'Password is a required field'
    isValid = false
  } else {
    let regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/

    if (
      !regex.test(regPasswordInput.value.trim()) ||
      regPasswordInput.value.length < 10
    ) {
      isValid = false
      passwordErr.textContent =
        'Password must have a capital letter, number and special character and a minimum of ten characters'
    } else {
      passwordErr.textContent = ''
      user.password = regPasswordInput.value.trim()
    }
  }

  if (!regConfirmPassword.value.trim()) {
    confirmPassErr.textContent = 'Confirm password is a required field'
    isValid = false
  } else {
    if (regConfirmPassword.value !== regPasswordInput.value) {
      confirmPassErr.textContent = 'Passwords must match'
      isValid = false
    } else {
      confirmPassErr.textContent = ''
    }
  }

  if (isValid) {
    postRegisterData(user, `${http}auth/register`)
  }
})
