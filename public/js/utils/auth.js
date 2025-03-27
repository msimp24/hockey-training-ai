export async function checkAuth() {
  try {
    const response = await fetch('http://localhost:3000/auth/check-auth', {
      credentials: 'include',
    })
    const data = await response.json()

    //returns if the user is logged in and the userId that is loggedIn
    return data
  } catch (err) {
    console.error(err)
  }
}

export async function logout() {
  try {
    const response = await fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      credentials: 'include', // Ensures cookies are included
    })

    if (response.ok) {
      console.log('✅ Successfully logged out')
      window.location.href = '/login' // Redirect to login page
    } else {
      console.error('❌ Failed to log out')
    }
  } catch (error) {
    console.error('Error during logout:', error)
  }
}

export async function fetchUserData(userId) {
  try {
    const response = await fetch(`http://localhost:3000/user/${userId}`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const userData = await response.json()

    return userData
  } catch (err) {
    console.error('Error fetching data:', err.message || err)
    return { error: err.message || 'Unknown error occurred' }
  }
}

export async function fetchData(url) {
  try {
    const response = await fetch(url, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (err) {
    console.error('Error fetching data:', err.message || err)
    return { error: err.message || 'Unknown error occurred' }
  }
}
