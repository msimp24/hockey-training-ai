const http =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000/'
    : 'https://hockey-training-ai.com/'

const contactForm = document.querySelector('.contact-form')

//contact form selectors
const firstNameInput = document.querySelector('#first-name')
const lastNameInput = document.querySelector('#last-name')
const emailInput = document.querySelector('#email')
const subjectInput = document.querySelector('#subject')
const messageInput = document.querySelector('#message')

//contact form error selectors
const firstNameErr = document.querySelector('#first-name-err')
const lastNameErr = document.querySelector('#last-name-err')
const emailErr = document.querySelector('#email-err')
const subjectErr = document.querySelector('#subject-err')
const messageErr = document.querySelector('#message-err')

contactForm.addEventListener('submit', (e) => {
  let isValid = true
  let formData = {}
  e.preventDefault()

  if (!firstNameInput.value) {
    isValid = false
    firstNameErr.textContent = 'First Name is a required field'
  } else {
    formData.firstName = firstNameInput.value
    firstNameErr.textContent = ''
  }
  if (!lastNameInput.value) {
    isValid = false
    lastNameErr.textContent = 'Last Name is a required field'
  } else {
    formData.lastName = lastNameInput.value
    lastNameErr.textContent = ''
  }

  if (!emailInput.value.trim()) {
    emailErr.textContent = 'Email is a required field'
    isValid = false
  } else {
    let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!regex.test(emailInput.value.trim())) {
      isValid = false
      emailErr.textContent = 'Not a valid email address'
    } else {
      emailErr.textContent = ''
      formData.email = emailInput.value
    }
  }

  if (!subjectInput.value) {
    isValid = false
    subjectErr.textContent = 'Subject is a required field'
  } else {
    formData.subject = subjectInput.value
    subjectErr.textContent = ''
  }

  if (messageInput.value.length < 40) {
    isValid = false
    messageErr.textContent = 'Message must have a minimum of 30 characters'
  } else {
    formData.message = messageInput.value
    messageErr.textContent = ''
  }

  if (isValid) {
    sendContactUsForm(formData, `${http}user/contact`)
  }
})

const sendContactUsForm = async (data, url) => {
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
      messageErr.textContent = errorData.message

      // Optionally, throw an error for further handling
      throw new Error(
        `Response status: ${response.status} - ${errorData.message}`
      )
    } else {
      // Redirect to login if registration is successful
      alert('Thank you for your message. We will be in contact soon.')
      window.location.href = '/'
    }
  } catch (error) {
    // Log any error
    console.error(error)
  }
}
