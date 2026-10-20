<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

const route = useRoute()
const router = useRouter()
const store = useStore()
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

function addBook() {
  if (!book.value || !isAuthenticated.value) return
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
    <div v-else class="review-empty">
      <p>This book is no longer available.</p>
      <RouterLink class="button button-primary" to="/">Back to discovery</RouterLink>
    </div>
  </section>
</template>
