import { logout, checkAuth, fetchUserData } from './utils/utilities.js'

document.addEventListener('DOMContentLoaded', async () => {
  const http =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3000/'
      : 'https://hockey-training-ai.com/'

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
    const editWorkoutForm = document.querySelector('.edit-account-form')

    const firstNameErr = document.querySelector('#edit-fname-err')
    const lastNameErr = document.querySelector('#edit-lname-err')

    editFirstName.value = userData.firstName
    editLastName.value = userData.lastName

    editWorkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      let isValid = true

      let data = {}

      if (!editFirstName.value) {
        firstNameErr.textContent = 'First Name is a required field'
        isValid = false
      } else {
        firstNameErr.textContent = ''
        isValid = true
        data.firstName = editFirstName.value
      }

      if (!editLastName.value) {
        lastNameErr.textContent = 'Last Name is a required field'
        isValid = false
      } else {
        lastNameErr.textContent = ''
        isValid = true
        data.lastName = editLastName.value
      }

      if (isValid) {
        data.userId = userData.id
        alert(JSON.stringify(data))

        try {
          const response = await fetch(`${http}user/update-names`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            let errorMessage = `Error ${response.status}: Something went wrong.`

            // Attempt to extract JSON error details if possible

            // Display error message to user
            alert(errorMessage)
          }
          window.location.href = '/dashboard/profile/edit-account'
        } catch (err) {
          console.err(err)
        }
      }
    })
  }
})
