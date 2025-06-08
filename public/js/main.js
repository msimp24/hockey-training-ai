import { checkAuth, fetchUserData, logout } from './utils/utilities.js'

const homeRegisterBtn = document.querySelector('#register-btn')
const homeLoginBtn = document.querySelector('#login')
const homeBtnContainer = document.querySelector('.nav-btn-container')
const dashboardBtn = document.querySelector('#dashboard-btn')

const getStartedBtn = document.querySelectorAll('.get-started-btn')
const learnMoreBtn = document.querySelector('#learn-more-btn')

//get footer login

const footerLogin = document.getElementById('footer-login')

async function checkStatus() {
  const authData = await checkAuth()

  if (authData.loggedIn) {
    //removes login and register button if user already has an account

    homeRegisterBtn.style.display = 'none'
    homeLoginBtn.style.display = 'none'

    footerLogin.textContent = 'Logout'

    footerLogin.addEventListener('click', logout)

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

getStartedBtn.forEach((button) => {
  button.addEventListener('click', () => {
    window.location.href = '/register'
  })
})

dashboardBtn.addEventListener('click', () => {
  window.location.href = '/dashboard'
})

learnMoreBtn.addEventListener('click', () => {
  const targetSection = document.getElementById('website-info')
  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth' })
  }
})

window.onload = checkStatus()
