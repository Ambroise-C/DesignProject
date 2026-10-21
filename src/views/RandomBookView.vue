<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useStore } from 'vuex'
import BookCard from '../components/BookCard.vue'

const store = useStore()
const unreadBooks = computed(() => store.getters.library.filter((book) => !book.read))
const book = ref(null)
function loadRandomBook() {
  if (!unreadBooks.value.length) {
    book.value = null
    return
  }

  book.value = unreadBooks.value[Math.floor(Math.random() * unreadBooks.value.length)]
}
loadRandomBook()
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
        :disabled="unreadBooks.length === 0"
        @click="loadRandomBook"
      >
        Pick another book
      </button>
    </div>

    <div v-if="book" class="random-book-card">
      <BookCard
        :book="book"
      />
    </div>
    <div v-else class="state-message">
      <template v-if="store.getters.isAuthenticated">
        No unread books in your library yet.
        <RouterLink class="text-button" to="/library">Go to My shelves</RouterLink>
      </template>
      <template v-else>
        Sign in to pick a random book from your unread library.
        <RouterLink class="text-button" to="/login">Log in</RouterLink>
      </template>
    </div>
  </section>
</template>
