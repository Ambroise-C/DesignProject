import { createStore } from 'vuex'

const ACCOUNTS_KEY = 'fieldnotes-accounts'
const SESSION_KEY = 'fieldnotes-session'
const LIBRARIES_KEY = 'fieldnotes-libraries'
const LEGACY_LIBRARY_KEY = 'booknook-library'
const DEMO_SALT = 'fieldnotes-demo-account-salt'
const DEMO_HASH = '3ad8b33d14946c9f76cd4e30df93d4a4c6061f478232c56112a3388aa0ffc594'
const PBKDF2_ITERATIONS = 120_000
const MAX_NOTE_LENGTH = 280

function normalizeBook(book) {
  return {
    ...book,
    rating: Number.isInteger(book.rating) && book.rating >= 1 && book.rating <= 5
      ? book.rating
      : null,
    note: typeof book.note === 'string' ? book.note.slice(0, MAX_NOTE_LENGTH) : '',
  }
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch (error) {
    console.error(`Unable to read ${key} from local storage:`, error)
    return fallback
  }
}

function loadAccounts() {
  const savedAccounts = readStorage(ACCOUNTS_KEY, [])
  const accounts = Array.isArray(savedAccounts)
    ? savedAccounts.filter(
        (account) =>
          account &&
          typeof account.username === 'string' &&
          typeof account.salt === 'string' &&
          typeof account.hash === 'string',
      )
    : []

  if (!accounts.some((account) => account.username === 'test')) {
    accounts.push({ username: 'test', salt: DEMO_SALT, hash: DEMO_HASH })
  }

  return accounts
}

function loadLibraries(accounts) {
  const savedLibraries = readStorage(LIBRARIES_KEY, {})
  const libraries =
    savedLibraries && typeof savedLibraries === 'object' && !Array.isArray(savedLibraries)
      ? savedLibraries
      : {}

  const legacyLibrary = readStorage(LEGACY_LIBRARY_KEY, null)
  if (!Array.isArray(libraries.test) && Array.isArray(legacyLibrary)) {
    libraries.test = legacyLibrary
  }

  for (const account of accounts) {
    if (!Array.isArray(libraries[account.username])) {
      libraries[account.username] = []
    } else {
      libraries[account.username] = libraries[account.username]
        .filter((book) => book && typeof book === 'object' && typeof book.id === 'string')
        .map(normalizeBook)
    }
  }

  return libraries
}

function saveValue(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Unable to save ${key} to local storage:`, error)
  }
}

function loadUsername(accounts) {
  try {
    const username = localStorage.getItem(SESSION_KEY)
    return accounts.some((account) => account.username === username) ? username : null
  } catch (error) {
    console.error('Unable to restore the signed-in account:', error)
    return null
  }
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: new TextEncoder().encode(salt),
      iterations: PBKDF2_ITERATIONS,
    },
    key,
    256,
  )

  return bytesToHex(new Uint8Array(bits))
}

function createSalt() {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(16)))
}

function syncCurrentLibrary(state) {
  if (state.username) {
    state.libraries[state.username] = state.library
  }
}

const accounts = loadAccounts()
const libraries = loadLibraries(accounts)
const activeUsername = loadUsername(accounts)

saveValue(ACCOUNTS_KEY, accounts)
saveValue(LIBRARIES_KEY, libraries)

const store = createStore({
  state: {
    accounts,
    libraries,
    username: activeUsername,
    library: activeUsername ? libraries[activeUsername] : [],
  },
  getters: {
    isAuthenticated: (state) => Boolean(state.username),
    username: (state) => state.username,
    library: (state) => state.library,
    libraryCount: (state) => state.library.length,
    favorites: (state) => state.library.filter((book) => book.favorite),
    bookById: (state) => (id) => state.library.find((book) => book.id === id),
    isInLibrary: (state) => (id) => state.library.some((book) => book.id === id),
  },
  mutations: {
    setAccount(state, username) {
      state.username = username
      state.library = state.libraries[username] || []
    },
    addAccount(state, account) {
      state.accounts.push(account)
      state.libraries[account.username] = []
    },
    clearAccount(state) {
      syncCurrentLibrary(state)
      state.username = null
      state.library = []
    },
    addBook(state, book) {
      if (state.username && !state.library.some((item) => item.id === book.id)) {
        state.library.push({ ...book, favorite: false, read: false, rating: null, note: '' })
        syncCurrentLibrary(state)
      }
    },
    removeBook(state, id) {
      if (state.username) {
        state.library = state.library.filter((book) => book.id !== id)
        syncCurrentLibrary(state)
      }
    },
    toggleRead(state, id) {
      const book = state.username && state.library.find((item) => item.id === id)
      if (book) book.read = !book.read
      syncCurrentLibrary(state)
    },
    toggleFavorite(state, id) {
      const book = state.username && state.library.find((item) => item.id === id)
      if (book) book.favorite = !book.favorite
      syncCurrentLibrary(state)
    },
    setRating(state, { id, rating }) {
      const book = state.username && state.library.find((item) => item.id === id)
      if (book && (rating === null || (Number.isInteger(rating) && rating >= 1 && rating <= 5))) {
        book.rating = rating
        syncCurrentLibrary(state)
      }
    },
    setNote(state, { id, note }) {
      const book = state.username && state.library.find((item) => item.id === id)
      if (book && typeof note === 'string' && note.length <= MAX_NOTE_LENGTH) {
        book.note = note
        syncCurrentLibrary(state)
      }
    },
  },
  actions: {
    async login({ state, commit }, { username, password }) {
      const normalizedUsername = username.trim().toLowerCase()
      const account = state.accounts.find((item) => item.username === normalizedUsername)

      if (!account || (await hashPassword(password, account.salt)) !== account.hash) {
        throw new Error('Identifiant ou mot de passe incorrect.')
      }

      commit('setAccount', account.username)
    },
    async register({ state, commit }, { username, password }) {
      const normalizedUsername = username.trim().toLowerCase()
      if (!/^[a-z0-9_-]{3,24}$/.test(normalizedUsername)) {
        throw new Error('Le nom doit contenir 3 à 24 lettres, chiffres, tirets ou underscores.')
      }
      if (password.length < 4) {
        throw new Error('Le mot de passe doit contenir au moins 4 caractères.')
      }
      if (state.accounts.some((account) => account.username === normalizedUsername)) {
        throw new Error('Ce nom de compte existe déjà.')
      }

      const salt = createSalt()
      const hash = await hashPassword(password, salt)
      commit('addAccount', { username: normalizedUsername, salt, hash })
      commit('setAccount', normalizedUsername)
    },
    logout({ commit }) {
      commit('clearAccount')
    },
    addBook({ commit }, book) {
      commit('addBook', book)
    },
    removeBook({ commit }, id) {
      commit('removeBook', id)
    },
    toggleRead({ commit }, id) {
      commit('toggleRead', id)
    },
    toggleFavorite({ commit }, id) {
      commit('toggleFavorite', id)
    },
    setRating({ commit }, payload) {
      commit('setRating', payload)
    },
    setNote({ commit }, payload) {
      commit('setNote', payload)
    },
  },
})

store.subscribe((mutation, state) => {
  saveValue(ACCOUNTS_KEY, state.accounts)
  saveValue(LIBRARIES_KEY, state.libraries)

  try {
    if (state.username) {
      localStorage.setItem(SESSION_KEY, state.username)
    } else {
      localStorage.removeItem(SESSION_KEY)
    }
  } catch (error) {
    console.error('Unable to save the signed-in account:', error)
  }
})

export default store
