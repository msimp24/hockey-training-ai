import { logout, checkAuth, fetchUserData } from './utils/utilities.js'

document.addEventListener('DOMContentLoaded', async () => {
  //handles nav bar activity on the left side

  document.querySelectorAll('.profile-nav ul li a').forEach((link) => {
    link.addEventListener('click', function () {
      // Remove 'active' from all links
      document
        .querySelectorAll('.profile-nav ul li a')
        .forEach((l) => l.classList.remove('active'))
      // Add 'active' to the clicked one
      this.classList.add('active')
    })
  })

  document.querySelectorAll('.profile-nav ul li a').forEach((link) => {
    if (link.getAttribute('href') === window.location.pathname) {
      link.classList.add('active')
    }
  })

  // left side of profile page
  const profileLogOut = document.querySelector('#profile-logout')
  const profileUser = document.querySelector('#profile-user')
  const profileEmail = document.querySelector('#profile-email')

  const authData = await checkAuth()

  const userData = await fetchUserData(authData.userId)
  profileUser.textContent = `Welcome, ${userData.firstName} ${userData.lastName}`
  profileEmail.textContent = `${userData.email}`

  profileLogOut.addEventListener('click', () => {
    logout()
  })

  //handles edit account page
  if (window.location.pathname === '/dashboard/profile/edit-account') {
    const editFirstName = document.querySelector('#edit-first-name')
    const editLastName = document.querySelector('#edit-last-name')

    editFirstName.value = userData.firstName
    editLastName.value = userData.lastName
  }
})
