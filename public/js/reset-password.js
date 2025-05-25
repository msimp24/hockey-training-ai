const http =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000/'
    : 'https://hockey-training-ai.com/'

document.addEventListener('DOMContentLoaded', () => {
  let path = window.location.pathname

  if (path === '/forgot-password') {
    //selectors for forgot email page
    const newEmail = document.querySelector('#email-new-password')
    const newEmailErr = document.querySelector('#new-pass-err')

    const forgotPassForm = document.querySelector('#forgot-pass-form')

    forgotPassForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      let isValid = true
      let data = {}

      if (!newEmail.value.trim()) {
        newEmailErr.textContent = 'Email is a required field'
        isValid = false
      } else {
        let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!regex.test(newEmail.value.trim())) {
          isValid = false
          newEmailErr.textContent = 'Not a valid email address'
        } else {
          newEmailErr.textContent = ''
          data.email = newEmail.value
        }
      }

      if (isValid) {
        try {
          const response = await fetch(`${http}auth/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            // Attempt to extract JSON error details if possible
            const errorJson = await response.json()

            newEmailErr.textContent = errorJson.message
          } else {
            alert('Reset link sent to your email')
            window.location.href = '/'
          }
        } catch (err) {
          console.err(err)
        }
      }
    })
  } else {
    //selectors for reset password page
    const newPassword = document.querySelector('#new-password')
    const confirmNewPassword = document.querySelector('#confirm-new-password')

    const passErr = document.querySelector('#pass-err')
    const confirmPassErr = document.querySelector('#confirm-pass-err')

    const resetPassForm = document.querySelector('#reset-pass-form')

    let token = location.pathname.split('/').pop()

    console.log(token)

    resetPassForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      let isValid = true
      let data = {}

      if (!newPassword.value.trim()) {
        passErr.textContent = 'Password is a required field'
        isValid = false
      } else {
        let regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/

        if (
          !regex.test(newPassword.value.trim()) ||
          newPassword.value.length < 10
        ) {
          isValid = false
          passErr.textContent =
            'Password must have a capital letter, number and special character and a minimum of ten characters'
        } else {
          passErr.textContent = ''
          data.password = newPassword.value.trim()
        }
      }

      if (!confirmNewPassword.value.trim()) {
        confirmPassErr.textContent = 'Confirm password is a required field'
        isValid = false
      } else {
        if (confirmNewPassword.value !== newPassword.value) {
          confirmPassErr.textContent = 'Passwords must match'
          isValid = false
        } else {
          confirmPassErr.textContent = ''
        }
      }

      if (isValid) {
        try {
          const response = await fetch(`${http}auth/reset-password/${token}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            // Attempt to extract JSON error details if possible
            const errorJson = await response.json()

            confirmPassErr.textContent = errorJson.message
          } else {
            alert('Password successfully updated')
            window.location.href = '/login'
          }
        } catch (err) {
          console.err(err)
        }
      }
    })
  }
})
