<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { savePendingBookAdd } from '../utils/pendingBookAdd'

const route = useRoute()
const router = useRouter()
const store = useStore()
const averageRating = ref(null)
const ratingCount = ref(0)
const ratingLoading = ref(false)
const ratingError = ref(false)
const addError = ref('')

const book = computed(() => {
  const id = typeof route.query.id === 'string' ? route.query.id : ''
  const savedBook = store.getters.bookById(id)
  if (savedBook) return savedBook

  const title = typeof route.query.title === 'string' ? route.query.title : ''
  if (!id || !title) return null

  return {
    id,
    title,
    author: typeof route.query.author === 'string' ? route.query.author : '',
    year: typeof route.query.year === 'string' ? route.query.year : '',
    cover: typeof route.query.cover === 'string' ? route.query.cover : '',
    favorite: false,
    read: false,
  }
})
const inLibrary = computed(() => book.value && store.getters.isInLibrary(book.value.id))
const isAuthenticated = computed(() => store.getters.isAuthenticated)
const returnTo = computed(() => {
  const requestedPath = route.query.returnTo
  return ['/library', '/favorites', '/random'].includes(requestedPath) ? requestedPath : '/'
})
const backLabel = computed(() => {
  if (returnTo.value === '/library') return 'Back to my shelves'
  if (returnTo.value === '/favorites') return 'Back to favorites'
  if (returnTo.value === '/random') return 'Back to random book'
  return 'Back to discovery'
})
const personalRating = computed(() =>
  Number.isInteger(book.value?.rating) && book.value.rating >= 1 && book.value.rating <= 5
    ? book.value.rating
    : null,
)
const displayAverageRating = computed(() => {
  if (averageRating.value === null) return personalRating.value
  if (personalRating.value === null) return averageRating.value

  return (
    (averageRating.value * ratingCount.value + personalRating.value) /
    (ratingCount.value + 1)
  )
})
const displayRatingCount = computed(
  () => ratingCount.value + (personalRating.value === null ? 0 : 1),
)

watch(
  () => book.value?.id,
  async (id, _, onCleanup) => {
    averageRating.value = null
    ratingCount.value = 0
    ratingLoading.value = false
    ratingError.value = false
    const workId = id?.match(/^\/works\/[A-Za-z0-9]+$/)?.[0]
    if (!workId) return

    const controller = new AbortController()
    onCleanup(() => controller.abort())
    ratingLoading.value = true

    try {
      const response = await fetch(`https://openlibrary.org${workId}/ratings.json`, {
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`Open Library returned ${response.status}.`)
      }

      const data = await response.json()
      if (
        !Number.isFinite(data.summary?.average) ||
        !Number.isFinite(data.summary?.count) ||
        data.summary.count < 0
      ) {
        throw new Error('Open Library returned invalid rating data.')
      }

      averageRating.value = data.summary.average
      ratingCount.value = data.summary.count
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Unable to load the community rating:', error)
        ratingError.value = true
      }
    } finally {
      if (!controller.signal.aborted) ratingLoading.value = false
    }
  },
  { immediate: true },
)

function addBook() {
  if (!book.value) return
  if (!isAuthenticated.value) {
    try {
      savePendingBookAdd(book.value)
      router.push({ name: 'login', query: { redirect: route.fullPath } })
    } catch (error) {
      addError.value =
        error instanceof Error ? error.message : 'Unable to continue with this book.'
    }
    return
  }
  addError.value = ''
  store.dispatch('addBook', book.value)
}

function removeBook() {
  if (!book.value) return
  store.dispatch('removeBook', book.value.id)
  router.push('/library')
}
</script>

<template>
  <section class="review-page page-wrap">
    <RouterLink class="back-link" :to="returnTo">← &nbsp;{{ backLabel }}</RouterLink>

    <div v-if="book" class="review-content">
      <div class="review-cover">
        <img v-if="book.cover" :src="book.cover" :alt="`Cover of ${book.title}`" />
        <div v-else class="cover-placeholder">Book</div>
      </div>
      <div class="review-details">
        <h1>{{ book.title }}</h1>
        <p class="review-author">{{ book.author || 'Author unknown' }}</p>
        <p v-if="book.year" class="review-year">First published {{ book.year }}</p>
        <p v-if="addError" class="login-message" role="alert">{{ addError }}</p>
        <div class="community-rating" aria-live="polite">
          <span class="community-rating-label">
            {{ personalRating === null ? 'Average rating' : 'Average rating, including yours' }}
          </span>
          <span v-if="ratingLoading" class="community-rating-value">Loading…</span>
          <span v-else-if="ratingError && personalRating === null" class="community-rating-value">
            Rating unavailable
          </span>
          <span v-else-if="displayRatingCount" class="community-rating-value">
            {{ displayAverageRating.toFixed(1) }} / 5 <span aria-hidden="true">★</span>
            <span class="community-rating-count">
              ({{ displayRatingCount.toLocaleString() }}
              {{ displayRatingCount === 1 ? 'rating' : 'ratings' }}
              <template v-if="ratingError">; community average unavailable</template>)
            </span>
          </span>
          <span v-else class="community-rating-value">No ratings yet</span>
        </div>
        <button
          v-if="isAuthenticated && !inLibrary"
          class="button button-primary review-primary"
          type="button"
          @click="addBook"
        >
          Add to my library <span aria-hidden="true">+</span>
        </button>
        <template v-else-if="isAuthenticated">
          <button
            class="button button-primary review-primary"
            type="button"
            @click="store.dispatch('toggleRead', book.id)"
          >
            {{ book.read ? 'Mark as unread' : 'Confirm as read' }}
          </button>
          <button class="review-remove" type="button" @click="removeBook">Remove from library</button>
        </template>
        <button
          v-else
          class="button button-primary review-primary"
          type="button"
          @click="addBook"
        >
          Log in to add this book to your library
        </button>
      </div>
    </div>
    <div v-else class="review-empty">
      <p>This book is no longer available.</p>
      <RouterLink class="button button-primary" to="/">Back to discovery</RouterLink>
    </div>
  </section>
</template>
