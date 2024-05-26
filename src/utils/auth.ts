const TOKEN_KEY = "token"

function isLogin() {
  // return !!localStorage.getItem(TOKEN_KEY)
  return !!uni.getStorageSync(TOKEN_KEY)
}

function getToken() {
  // return localStorage.getItem(TOKEN_KEY)
  return uni.getStorageSync(TOKEN_KEY)
}

function setToken(token: string) {
  // localStorage.setItem(TOKEN_KEY, token)
  uni.setStorageSync(TOKEN_KEY, token)
}

function clearToken() {
  // localStorage.removeItem(TOKEN_KEY)
  uni.removeStorageSync(TOKEN_KEY)
}

export { isLogin, getToken, setToken, clearToken }
