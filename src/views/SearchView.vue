<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import BookCard from '../components/BookCard.vue'

const store = useStore()
const isAuthenticated = computed(() => store.getters.isAuthenticated)
const query = ref('')
const language = ref('')
const genre = ref('')
const minimumRating = ref('')
const hideLibraryBooks = ref(true)
const books = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const searched = ref(false)
const hasMore = ref(false)
const searchPage = ref(1)
const errorMessage = ref('')
const notice = ref('')
let activeRequest
let noticeTimer

function normalizeBooks(docs) {
  return (Array.isArray(docs) ? docs : [])
    .filter((book) => book.key && book.title)
    .map((book) => ({
      id: book.key,
      title: book.title,
      author: book.author_name?.[0] || '',
      year: book.first_publish_year || null,
      averageRating: Number.isFinite(book.ratings_average) ? book.ratings_average : null,
      cover: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg?default=false`
        : '',
      subjects: Array.isArray(book.subject) ? book.subject.slice(0, 12) : [],
    }))
}

async function localizeBooks(results, languageCode, signal) {
  const localizedBooks = await Promise.all(
    results.map(async (book) => {
      const params = new URLSearchParams({
        limit: '100',
        fields: 'title,languages,covers,publish_date',
      })
      const response = await fetch(`https://openlibrary.org${book.id}/editions.json?${params}`, {
        signal,
      })

      if (!response.ok) {
        throw new Error(`Open Library returned ${response.status}. Please try again.`)
      }

      const data = await response.json()
      const edition = data.entries?.find(
        (item) =>
          typeof item.title === 'string' &&
          item.languages?.some((itemLanguage) => itemLanguage.key === `/languages/${languageCode}`),
      )

      if (!edition) return null

      return {
        ...book,
        title: edition.title,
        cover: edition.covers?.[0]
          ? `https://covers.openlibrary.org/b/id/${edition.covers[0]}-M.jpg?default=false`
          : book.cover,
      }
    }),
  )

  return localizedBooks.filter(Boolean)
}

const booksWithStatus = computed(() => {
  const libraryBooks = store.getters.library
  const libraryBookIds = new Set(libraryBooks.map((book) => book.id))

  return books.value
    .filter((book) => !hideLibraryBooks.value || !libraryBookIds.has(book.id))
    .map((book) => ({
      ...book,
      inLibrary: store.getters.isInLibrary(book.id),
    }))
})

async function loadBooks(
  searchTerm,
  limit,
  randomize = false,
  languageCode = '',
  minRating = '',
  page = 1,
  append = false,
) {
  activeRequest?.abort()
  const requestController = new AbortController()
  activeRequest = requestController
  loading.value = !append
  loadingMore.value = append
  errorMessage.value = ''

  try {
    const params = new URLSearchParams({
      q: searchTerm,
      limit: String(limit),
      page: String(page),
      fields: 'key,title,author_name,first_publish_year,cover_i,subject,ratings_average',
    })
    const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
      signal: requestController.signal,
    })

    if (!response.ok) {
      throw new Error(`Open Library returned ${response.status}. Please try again.`)
    }

    const data = await response.json()
    let results = normalizeBooks(data.docs)

    if (minRating) {
      results = results.filter(
        (book) => book.averageRating !== null && book.averageRating >= Number(minRating),
      )
    }

    if (languageCode) {
      results = await localizeBooks(results, languageCode, requestController.signal)
    }

    if (randomize) {
      for (let index = results.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        const book = results[index]
        results[index] = results[randomIndex]
        results[randomIndex] = book
      }
    }

    if (append) {
      const existingIds = new Set(books.value.map((book) => book.id))
      books.value = [
        ...books.value,
        ...results.filter((book) => !existingIds.has(book.id)),
      ]
    } else {
      books.value = randomize ? results.slice(0, 20) : results
    }
    if (!randomize) {
      searchPage.value = page
      hasMore.value = page * limit < (data.numFound || 0)
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      errorMessage.value =
        error instanceof Error ? error.message : 'Something went wrong while searching.'
    }
  } finally {
    if (!requestController.signal.aborted) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

function loadFeaturedBooks() {
  const shelfSubjects = store.getters.library.flatMap((book) =>
    Array.isArray(book.subjects)
      ? book.subjects.filter((subject) => typeof subject === 'string' && subject.trim())
      : [],
  )

  if (!shelfSubjects.length) return loadBooks('subject:fiction', 100, true)

  activeRequest?.abort()
  const requestController = new AbortController()
  activeRequest = requestController
  loading.value = true
  errorMessage.value = ''

  const selectedSubjects = Array.from({ length: 20 }, () =>
    shelfSubjects[Math.floor(Math.random() * shelfSubjects.length)],
  )
  const uniqueSubjects = [...new Set(selectedSubjects)]

  return Promise.all(
    uniqueSubjects.map(async (subject) => {
      const params = new URLSearchParams({
        q: `subject:${subject}`,
        limit: '100',
        fields: 'key,title,author_name,first_publish_year,cover_i,subject,ratings_average',
      })
      const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
        signal: requestController.signal,
      })

      if (!response.ok) {
        throw new Error(`Open Library returned ${response.status}. Please try again.`)
      }

      const data = await response.json()
      const results = normalizeBooks(data.docs)
      for (let index = results.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        const book = results[index]
        results[index] = results[randomIndex]
        results[randomIndex] = book
      }

      return [subject, results]
    }),
  )
    .then((subjectResults) => {
      const booksBySubject = new Map(subjectResults)
      const usedBookIds = new Set()

      books.value = selectedSubjects.flatMap((subject) => {
        const book = booksBySubject
          .get(subject)
          .find((candidate) => !usedBookIds.has(candidate.id))

        if (!book) return []
        usedBookIds.add(book.id)
        return [book]
      })
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        errorMessage.value =
          error instanceof Error ? error.message : 'Something went wrong while searching.'
      }
    })
    .finally(() => {
      if (!requestController.signal.aborted) loading.value = false
    })
}

function searchBooks(searchTerm = query.value) {
  const normalizedQuery = searchTerm.trim()
  if (!normalizedQuery && !language.value && !genre.value && !minimumRating.value) return

  query.value = normalizedQuery
  searched.value = true
  const searchParts = [normalizedQuery]
  if (language.value) searchParts.push(`language:${language.value}`)
  if (genre.value) searchParts.push(`subject:"${genre.value}"`)

  return loadBooks(
    searchParts.filter(Boolean).join(' AND '),
    12,
    false,
    language.value,
    minimumRating.value,
  )
}

function loadMoreBooks() {
  if (!hasMore.value || loading.value || loadingMore.value) return

  const searchParts = [query.value.trim()]
  if (language.value) searchParts.push(`language:${language.value}`)
  if (genre.value) searchParts.push(`subject:"${genre.value}"`)

  return loadBooks(
    searchParts.filter(Boolean).join(' AND '),
    12,
    false,
    language.value,
    minimumRating.value,
    searchPage.value + 1,
    true,
  )
}

onMounted(loadFeaturedBooks)

function addBook(book) {
  if (!isAuthenticated.value) return

  store.dispatch('addBook', book)
  notice.value = 'Added to your library'
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => {
    notice.value = ''
  }, 2400)
}

onBeforeUnmount(() => {
  activeRequest?.abort()
  window.clearTimeout(noticeTimer)
})
</script>

<template>
  <section class="discover-page page-wrap">
    <form class="search-form" @submit.prevent="searchBooks()">
      <span class="search-icon" aria-hidden="true">⌕</span>
      <label class="sr-only" for="book-search">Search by title, author, or keyword</label>
      <input
        id="book-search"
        v-model="query"
        type="search"
        placeholder="Search books"
        autocomplete="off"
      />
      <button
        class="button button-primary"
        type="submit"
        :disabled="
          (searched && loading) ||
          (!query.trim() && !language && !genre && !minimumRating)
        "
      >
        {{ searched && loading ? 'Searching…' : 'Find a book' }}
      </button>
    </form>
    <div class="search-filters">
      <label class="filter-field">
        <span>Language</span>
        <select v-model="language" aria-label="Filter by language">
          <option value="">Any language</option>
          <option value="eng">English</option>
          <option value="fre">French</option>
          <option value="spa">Spanish</option>
          <option value="ger">German</option>
          <option value="ita">Italian</option>
          <option value="por">Portuguese</option>
          <option value="jpn">Japanese</option>
          <option value="chi">Chinese</option>
        </select>
      </label>
      <label class="filter-field">
        <span>Genre</span>
        <select v-model="genre" aria-label="Filter by genre">
          <option value="">Any genre</option>
          <option value="fiction">Fiction</option>
          <option value="fantasy">Fantasy</option>
          <option value="science fiction">Science fiction</option>
          <option value="mystery">Mystery</option>
          <option value="romance">Romance</option>
          <option value="thriller">Thriller</option>
          <option value="horror">Horror</option>
          <option value="history">History</option>
          <option value="biography">Biography</option>
          <option value="poetry">Poetry</option>
        </select>
      </label>
      <label class="filter-field">
        <span>Minimum rating</span>
        <select v-model="minimumRating" aria-label="Filter by minimum average rating">
          <option value="">Any rating</option>
          <option value="3">3+ stars</option>
          <option value="4">4+ stars</option>
          <option value="4.5">4.5+ stars</option>
        </select>
      </label>
      <label class="filter-field read-filter">
        <input v-model="hideLibraryBooks" type="checkbox" />
        <span>Hide books already in my library</span>
      </label>
    </div>

    <div class="section-heading results-heading">
      <div>
        <h1>{{ searched ? 'Search results' : 'On the shelves' }}</h1>
      </div>
      <div class="results-actions">
        <span v-if="booksWithStatus.length" class="results-count">
          {{ booksWithStatus.length }} {{ booksWithStatus.length === 1 ? 'book' : 'books' }}
        </span>
        <button
          class="button refresh-button"
          type="button"
          :disabled="loading || loadingMore"
          @click="searched ? searchBooks() : loadFeaturedBooks()"
        >
          {{ loading && !loadingMore ? 'Refreshing…' : 'Refresh' }}
        </button>
      </div>
    </div>

    <div v-if="errorMessage" class="state-message error-message" role="alert">
      <strong>We couldn’t reach the library.</strong>
      <span>{{ errorMessage }}</span>
      <button
        class="text-button"
        type="button"
        @click="searched ? searchBooks() : loadFeaturedBooks()"
      >Try again</button>
    </div>
    <div v-else-if="loading && !loadingMore" class="state-message">Looking through the shelves…</div>
    <div v-else-if="booksWithStatus.length" class="book-grid">
      <BookCard
        v-for="book in booksWithStatus"
        :key="book.id"
        :book="book"
        :in-library="book.inLibrary"
        :can-add="isAuthenticated"
        @add="addBook"
      />
    </div>
    <div
      v-if="searched && !loading && !loadingMore && !errorMessage && !booksWithStatus.length"
      class="state-message"
    >
      {{
        books.length && hideLibraryBooks
          ? 'No books match this filter. Try turning it off.'
          : `No books found for${query ? ` “${query}”` : ' these filters'}. Try different search criteria.`
      }}
    </div>
    <div
      v-if="!searched && !loading && !errorMessage && !booksWithStatus.length"
      class="welcome-state"
    >
      <div class="welcome-icon" aria-hidden="true">✳</div>
      <p>Find a book to begin.</p>
      <span>Search by title, author, or a phrase you can’t quite forget.</span>
    </div>
    <div v-if="searched && hasMore" class="load-more-wrap">
      <button
        class="button load-more-button"
        type="button"
        :disabled="loadingMore || loading"
        @click="loadMoreBooks"
      >
        {{ loadingMore ? 'Loading…' : 'Load more' }}
      </button>
    </div>

    <Transition name="toast">
      <div v-if="notice" class="toast-message" role="status">{{ notice }} <span>✓</span></div>
    </Transition>
  </section>
</template>
