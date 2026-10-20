<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import BookCard from '../components/BookCard.vue'

const route = useRoute()
const router = useRouter()
const store = useStore()
const recommendations = ref([])
const loadingRecommendations = ref(false)
const recommendationError = ref('')
let recommendationRequest

const book = computed(() => {
  const id = typeof route.query.id === 'string' ? route.query.id : ''
  const savedBook = store.getters.bookById(id)
  if (savedBook) return savedBook

  const title = typeof route.query.title === 'string' ? route.query.title : ''
  if (!id || !title) return null
  const subjects =
    typeof route.query.subjects === 'string' ? route.query.subjects.split('|').filter(Boolean) : []

  return {
    id,
    title,
    author: typeof route.query.author === 'string' ? route.query.author : '',
    year: typeof route.query.year === 'string' ? route.query.year : '',
    cover: typeof route.query.cover === 'string' ? route.query.cover : '',
    subjects,
    favorite: false,
    read: false,
  }
})
const inLibrary = computed(() => book.value && store.getters.isInLibrary(book.value.id))
const isAuthenticated = computed(() => store.getters.isAuthenticated)
const recommendationsWithStatus = computed(() =>
  recommendations.value.map((recommendedBook) => ({
    ...recommendedBook,
    inLibrary: store.getters.isInLibrary(recommendedBook.id),
  })),
)

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

async function loadRecommendations(selectedBook) {
  recommendationRequest?.abort()
  recommendations.value = []
  recommendationError.value = ''

  if (!selectedBook) {
    loadingRecommendations.value = false
    return
  }

  const controller = new AbortController()
  recommendationRequest = controller
  loadingRecommendations.value = true

  const params = {
    limit: '24',
    fields: 'key,title,author_name,first_publish_year,cover_i,subject',
  }
  const queries = []

  if (selectedBook.author) {
    queries.push({ author: selectedBook.author, reason: 'author' })
  }

  for (const subject of (selectedBook.subjects || []).slice(0, 2)) {
    queries.push({ subject, reason: 'subject' })
  }

  try {
    if (!queries.length) {
      recommendations.value = []
      return
    }

    const results = await Promise.all(
      queries.map(async ({ author, subject }) => {
        const searchParams = new URLSearchParams(params)
        if (author) searchParams.set('author', author)
        if (subject) searchParams.set('subject', subject)

        const response = await fetch(`https://openlibrary.org/search.json?${searchParams}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Open Library returned ${response.status}. Please try again.`)
        }

        const data = await response.json()
        return Array.isArray(data.docs) ? data.docs : []
      }),
    )

    if (controller.signal.aborted) return

    const selectedTitle = normalizeText(selectedBook.title)
    const selectedAuthor = normalizeText(selectedBook.author || '')
    const selectedSubjects = new Set(
      (selectedBook.subjects || []).map(normalizeText).filter(Boolean),
    )
    const candidates = new Map()

    for (const [queryIndex, docs] of results.entries()) {
      for (const result of docs) {
        const resultTitle = normalizeText(result.title || '')
        const repeatsSelectedTitle =
          resultTitle === selectedTitle ||
          resultTitle.startsWith(`${selectedTitle} `) ||
          resultTitle.includes(` ${selectedTitle} `) ||
          resultTitle.endsWith(` ${selectedTitle}`)

        if (
          !result.key ||
          !result.title ||
          result.key === selectedBook.id ||
          repeatsSelectedTitle
        ) {
          continue
        }

        const authors = Array.isArray(result.author_name) ? result.author_name : []
        const authorMatch =
          selectedAuthor !== '' && authors.some((author) => normalizeText(author) === selectedAuthor)
        const resultSubjects = Array.isArray(result.subject)
          ? result.subject.map(normalizeText).filter(Boolean)
          : []
        const sharedSubjects = resultSubjects.filter((subject) => selectedSubjects.has(subject))

        if (!authorMatch && sharedSubjects.length === 0) continue

        const existing = candidates.get(result.key)
        const recommendation = {
          id: result.key,
          title: result.title,
          author: authors[0] || '',
          year: result.first_publish_year || null,
          cover: result.cover_i
            ? `https://covers.openlibrary.org/b/id/${result.cover_i}-M.jpg?default=false`
            : '',
          subjects: Array.isArray(result.subject) ? result.subject.slice(0, 12) : [],
          reason: authorMatch ? 'Même auteur' : 'Genre similaire',
          score: (authorMatch ? 100 : 0) + sharedSubjects.length * 10 - queryIndex,
        }

        if (!existing || recommendation.score > existing.score) {
          candidates.set(result.key, recommendation)
        }
      }
    }

    recommendations.value = [...candidates.values()]
      .sort((left, right) => right.score - left.score)
      .slice(0, 8)
  } catch (error) {
    if (error.name !== 'AbortError' && !controller.signal.aborted) {
      recommendationError.value =
        error instanceof Error
          ? error.message
          : 'Impossible de charger les recommandations pour le moment.'
    }
  } finally {
    if (!controller.signal.aborted) loadingRecommendations.value = false
  }
}

watch(book, loadRecommendations, { immediate: true })

function addBook() {
  if (!book.value || !isAuthenticated.value) return
  store.dispatch('addBook', book.value)
}

function removeBook() {
  if (!book.value) return
  store.dispatch('removeBook', book.value.id)
  router.push('/library')
}

function addRecommendedBook(recommendedBook) {
  if (!isAuthenticated.value) return
  store.dispatch('addBook', recommendedBook)
}

onBeforeUnmount(() => {
  recommendationRequest?.abort()
})
</script>

<template>
  <section class="review-page page-wrap">
    <RouterLink class="back-link" to="/">← &nbsp;Back to discovery</RouterLink>

    <div v-if="book" class="review-content">
      <div class="review-cover">
        <img v-if="book.cover" :src="book.cover" :alt="`Cover of ${book.title}`" />
        <div v-else class="cover-placeholder">Book</div>
      </div>
      <div class="review-details">
        <p class="eyebrow">A BOOK ON YOUR SHELF</p>
        <h1>{{ book.title }}</h1>
        <p class="review-author">{{ book.author || 'Author unknown' }}</p>
        <p v-if="book.year" class="review-year">First published {{ book.year }}</p>
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
        <RouterLink v-else class="button button-primary review-primary" to="/login">
          Connectez-vous pour enregistrer ce livre
        </RouterLink>
      </div>
    </div>
    <section v-if="book" class="recommendations-section" aria-labelledby="recommendations-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">POUR PROLONGER LA LECTURE</p>
          <h2 id="recommendations-title">Vous pourriez aussi aimer</h2>
        </div>
        <span v-if="recommendations.length" class="results-count">
          {{ recommendations.length }} livres
        </span>
      </div>

      <div v-if="loadingRecommendations" class="state-message" role="status">
        Recherche de livres dans le même esprit…
      </div>
      <div v-else-if="recommendationError" class="state-message error-message" role="alert">
        <strong>Les recommandations ne sont pas disponibles.</strong>
        <span>{{ recommendationError }}</span>
        <button class="text-button" type="button" @click="loadRecommendations(book)">
          Réessayer
        </button>
      </div>
      <div v-else-if="recommendationsWithStatus.length" class="book-grid">
        <article
          v-for="recommendedBook in recommendationsWithStatus"
          :key="recommendedBook.id"
          class="recommendation-card"
        >
          <p class="recommendation-reason">{{ recommendedBook.reason }}</p>
          <BookCard
            :book="recommendedBook"
            :in-library="recommendedBook.inLibrary"
            :can-add="isAuthenticated"
            @add="addRecommendedBook"
          />
        </article>
      </div>
      <div v-else class="state-message">
        Aucune recommandation similaire n’a été trouvée pour ce livre.
      </div>
    </section>
    <div v-else class="review-empty">
      <p>This book is no longer available.</p>
      <RouterLink class="button button-primary" to="/">Back to discovery</RouterLink>
    </div>
  </section>
</template>
