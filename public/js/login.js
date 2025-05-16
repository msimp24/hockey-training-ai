import { checkAuth } from './utils/utilities.js'

const http =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000/'
    : 'https://hockey-training-ai.com/'

window.onload = async () => {
  const authData = await checkAuth()

  if (authData.loggedIn) {
    window.location.href = '/dashboard'
  }
}

//login page form handling

const loginForm = document.querySelector('#login-form')
const loginBtn = document.querySelector('#login-btn')

const loginEmailInput = document.querySelector('#log-email')
const logPasswordInput = document.querySelector('#log-password')

const logEmailErr = document.querySelector('#log-email-err')
const logPasswordErr = document.querySelector('#log-password-err')

async function postLoginData(url, data) {
  loginBtn.disabled = true
  loginBtn.innerHTML = ''
  loginBtn.textContent = 'Logging in...'

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    })

    if (!response.ok) {
      const errorJson = await response.json()

      loginBtn.textContent = 'Login'
      loginBtn.disabled = false

      logPasswordErr.textContent = errorJson.message
    } else {
      window.location.href = '/dashboard'
    }
  } catch (err) {
    {
      console.error(err)
    }
  }
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault()
  let isValid = true

  let user = {}

  if (!loginEmailInput.value.trim()) {
    isValid = false
    logEmailErr.textContent = 'Email is a required field'
  } else {
    let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!regex.test(loginEmailInput.value.trim())) {
      isValid = false
      logEmailErr.textContent = 'Not a valid email address'
    } else {
      logEmailErr.textContent = ''
      user.email = loginEmailInput.value
    }
  }

  if (!logPasswordInput.value.trim()) {
    isValid = false
    logPasswordErr.textContent = 'Password is a required field'
  } else {
    logPasswordErr.textContent = ''
    user.password = logPasswordInput.value
  }

  if (isValid) {
    postLoginData(`${http}auth/login`, user)
  }
})
