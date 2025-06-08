export const http =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000/'
    : 'https://hockey-training-ai.com/'

export async function checkAuth() {
  try {
    const response = await fetch(`${http}auth/check-auth`, {
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
    const response = await fetch(`${http}auth/logout`, {
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
    const response = await fetch(`${http}user/${userId}`, {
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

export async function fetchUserTokens(url, userId) {
  try {
    const response = await fetch(`${url}/${userId}`, {
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

export function capitalize(str) {
  let char = str.slice(0, 1).toUpperCase()
  let temp = str.slice(1)
  temp = char + temp
  return temp
}
