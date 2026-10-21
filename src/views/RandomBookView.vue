<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import BookCard from '../components/BookCard.vue'

const store = useStore()
const isAuthenticated = computed(() => store.getters.isAuthenticated)
const book = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const notice = ref('')
let activeRequest
let noticeTimer

async function loadRandomBook() {
  activeRequest?.abort()
  const requestController = new AbortController()
  activeRequest = requestController
  loading.value = true
  errorMessage.value = ''

  try {
    const params = new URLSearchParams({
      q: 'subject:fiction',
      sort: 'random',
      limit: '20',
      fields: 'key,title,author_name,first_publish_year,cover_i,subject',
    })
    const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
      signal: requestController.signal,
    })

    if (!response.ok) {
      throw new Error(`Open Library returned ${response.status}. Please try again.`)
    }

    const data = await response.json()
    const books = (Array.isArray(data.docs) ? data.docs : [])
      .filter((item) => item.key && item.title)
      .map((item) => ({
        id: item.key,
        title: item.title,
        author: item.author_name?.[0] || '',
        year: item.first_publish_year || null,
        cover: item.cover_i
          ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg?default=false`
          : '',
        subjects: Array.isArray(item.subject) ? item.subject.slice(0, 12) : [],
      }))

    if (!books.length) {
      throw new Error('No random books were found. Please try again.')
    }

    book.value = books[Math.floor(Math.random() * books.length)]
  } catch (error) {
    if (error.name !== 'AbortError') {
      errorMessage.value =
        error instanceof Error ? error.message : 'Something went wrong while loading a book.'
    }
  } finally {
    if (!requestController.signal.aborted) loading.value = false
  }
}

function addBook(selectedBook) {
  if (!isAuthenticated.value) return

  store.dispatch('addBook', selectedBook)
  notice.value = 'Added to your library'
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => {
    notice.value = ''
  }, 2400)
}

onMounted(loadRandomBook)
onBeforeUnmount(() => {
  activeRequest?.abort()
  window.clearTimeout(noticeTimer)
})
</script>

<template>
  <section class="random-book-page page-wrap">
    <div class="section-heading">
      <div>
        <p class="eyebrow">A little inspiration</p>
        <h1>Random book</h1>
      </div>
      <button
        class="button button-primary"
        type="button"
        :disabled="loading"
        @click="loadRandomBook"
      >
        {{ loading ? 'Finding a book…' : 'Pick another book' }}
      </button>
    </div>

    <div v-if="errorMessage" class="state-message error-message" role="alert">
      <strong>We couldn’t find a book.</strong>
      <span>{{ errorMessage }}</span>
      <button class="text-button" type="button" @click="loadRandomBook">Try again</button>
    </div>
    <div v-else-if="loading && !book" class="state-message">Finding a book for you…</div>
    <div v-else-if="book" class="random-book-card">
      <BookCard
        :book="book"
        :in-library="store.getters.isInLibrary(book.id)"
        :can-add="isAuthenticated"
        @add="addBook"
      />
    </div>

    <Transition name="toast">
      <div v-if="notice" class="toast-message" role="status">{{ notice }} <span>✓</span></div>
    </Transition>
  </section>
</template>
