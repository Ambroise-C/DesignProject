<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useStore } from 'vuex'
import BookCard from '../components/BookCard.vue'

const store = useStore()
const isAuthenticated = computed(() => store.getters.isAuthenticated)
const query = ref('')
const books = ref([])
const loading = ref(false)
const searched = ref(false)
const errorMessage = ref('')
const notice = ref('')
let activeRequest
let noticeTimer

const booksWithStatus = computed(() =>
  books.value.map((book) => ({
    ...book,
    inLibrary: store.getters.isInLibrary(book.id),
  })),
)

async function searchBooks(searchTerm = query.value) {
  const normalizedQuery = searchTerm.trim()
  if (!normalizedQuery) return

  query.value = normalizedQuery
  activeRequest?.abort()
  const requestController = new AbortController()
  activeRequest = requestController
  loading.value = true
  searched.value = true
  errorMessage.value = ''

  try {
    const params = new URLSearchParams({
      q: normalizedQuery,
      limit: '12',
      fields: 'key,title,author_name,first_publish_year,cover_i',
    })
    const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
      signal: requestController.signal,
    })

    if (!response.ok) {
      throw new Error(`Open Library returned ${response.status}. Please try again.`)
    }

    const data = await response.json()
    books.value = (data.docs || [])
      .filter((book) => book.key && book.title)
      .map((book) => ({
        id: book.key,
        title: book.title,
        author: book.author_name?.[0] || '',
        year: book.first_publish_year || null,
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg?default=false`
          : '',
      }))
  } catch (error) {
    if (error.name !== 'AbortError') {
      errorMessage.value =
        error instanceof Error ? error.message : 'Something went wrong while searching.'
    }
  } finally {
    if (!requestController.signal.aborted) loading.value = false
  }
}

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
      <button class="button button-primary" type="submit" :disabled="loading || !query.trim()">
        {{ loading ? 'Searching…' : 'Find a book' }}
      </button>
    </form>

    <div class="section-heading results-heading">
      <div>
        <p class="eyebrow">A PERSONAL BOOKSHELF</p>
        <h1>{{ searched ? 'Search results' : 'On the shelves' }}</h1>
      </div>
      <span v-if="books.length" class="results-count">{{ books.length }} {{ books.length === 1 ? 'book' : 'books' }}</span>
    </div>

    <div v-if="errorMessage" class="state-message error-message" role="alert">
      <strong>We couldn’t reach the library.</strong>
      <span>{{ errorMessage }}</span>
      <button class="text-button" type="button" @click="searchBooks()">Try again</button>
    </div>
    <div v-else-if="loading" class="state-message">Looking through the shelves…</div>
    <div v-else-if="books.length" class="book-grid">
      <BookCard
        v-for="book in booksWithStatus"
        :key="book.id"
        :book="book"
        :in-library="book.inLibrary"
        :can-add="isAuthenticated"
        @add="addBook"
      />
    </div>
    <div v-else-if="searched" class="state-message">
      No books found for “{{ query }}”. Try another title, author, or keyword.
    </div>
    <div v-else class="welcome-state">
      <div class="welcome-icon" aria-hidden="true">✳</div>
      <p>Find a book to begin.</p>
      <span>Search by title, author, or a phrase you can’t quite forget.</span>
    </div>

    <Transition name="toast">
      <div v-if="notice" class="toast-message" role="status">{{ notice }} <span>✓</span></div>
    </Transition>
  </section>
</template>
