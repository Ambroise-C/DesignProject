<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  book: { type: Object, required: true },
  inLibrary: { type: Boolean, default: false },
  canAdd: { type: Boolean, default: false },
  actions: { type: Boolean, default: false },
})

const emit = defineEmits(['add', 'remove', 'toggle-read', 'toggle-favorite'])
const coverUnavailable = ref(false)

watch(
  () => props.book.cover,
  () => {
    coverUnavailable.value = false
  },
)
</script>

<template>
  <article class="book-card">
    <div class="book-cover">
      <img
        v-if="book.cover && !coverUnavailable"
        :src="book.cover"
        :alt="`Cover of ${book.title}`"
        loading="lazy"
        @error="coverUnavailable = true"
      />
      <div v-else class="cover-placeholder" aria-hidden="true">
        <span class="placeholder-mark">Book</span>
      </div>
      <RouterLink
        class="cover-link"
        :to="{
          name: 'review',
          query: { id: book.id, title: book.title, author: book.author, year: book.year, cover: book.cover },
        }"
        :aria-label="`Review ${book.title}`"
      />
      <button
        v-if="actions"
        class="favorite-button"
        :class="{ 'is-favorite': book.favorite }"
        type="button"
        :aria-label="book.favorite ? 'Remove from favorites' : 'Add to favorites'"
        :aria-pressed="book.favorite"
        @click="emit('toggle-favorite', book.id)"
      >
        {{ book.favorite ? '♥' : '♡' }}
      </button>
    </div>
    <div class="book-info">
      <p class="book-year">{{ book.year || 'Year unknown' }}</p>
      <h3 :title="book.title">
        <RouterLink
          :to="{
            name: 'review',
            query: { id: book.id, title: book.title, author: book.author, year: book.year, cover: book.cover },
          }"
        >{{ book.title }}</RouterLink>
      </h3>
      <p class="book-author">{{ book.author || 'Author unknown' }}</p>

      <button
        v-if="!actions && canAdd"
        class="button button-add"
        type="button"
        :disabled="inLibrary"
        @click="emit('add', book)"
      >
        <span>{{ inLibrary ? '✓' : '+' }}</span>
        {{ inLibrary ? 'In your library' : 'Add to library' }}
      </button>
      <div v-else class="card-actions">
        <button
          class="button button-read"
          :class="{ 'is-read': book.read }"
          type="button"
          @click="emit('toggle-read', book.id)"
        >
          {{ book.read ? '✓ Read' : 'Mark as read' }}
        </button>
        <button
          class="remove-button"
          type="button"
          :aria-label="`Remove ${book.title} from library`"
          @click="emit('remove', book.id)"
        >
          Remove
        </button>
      </div>
    </div>
  </article>
</template>
