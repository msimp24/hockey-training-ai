import { checkAuth, fetchUserData } from './utils/utilities.js'

const homeRegisterBtn = document.querySelector('#register-btn')
const homeLoginBtn = document.querySelector('#login')
const homeBtnContainer = document.querySelector('.nav-btn-container')
const dashboardBtn = document.querySelector('#dashboard-btn')

const getStartedBtn = document.querySelector('#get-started-btn')

async function checkStatus() {
  const authData = await checkAuth()

  if (authData.loggedIn) {
    //removes login and register button if user already has an account

    homeRegisterBtn.style.display = 'none'
    homeLoginBtn.style.display = 'none'

    //shows dashboard button if user is logged in
    dashboardBtn.style.display = 'block'

    //gets user data

    const userData = await fetchUserData(authData.userId)
    let header = document.createElement('h2')

    header.textContent = `Hello, ${userData.firstName}`
    homeBtnContainer.append(header)
  }
}
//home page buttons to go to pages on clicked
homeRegisterBtn.addEventListener('click', () => {
  window.location.href = '/register'
})

homeLoginBtn.addEventListener('click', () => {
  window.location.href = '/login'
})

getStartedBtn.addEventListener('click', () => {
  window.location.href = '/register'
})

dashboardBtn.addEventListener('click', () => {
  window.location.href = '/dashboard'
})

window.onload = checkStatus()
