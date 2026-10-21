const PENDING_BOOK_ADD_KEY = 'fieldnotes-pending-book-add'

export function savePendingBookAdd(book) {
  if (!book || typeof book.id !== 'string' || typeof book.title !== 'string') {
    throw new Error('This book cannot be saved for after sign-in.')
  }

  sessionStorage.setItem(
    PENDING_BOOK_ADD_KEY,
    JSON.stringify({
      id: book.id,
      title: book.title,
      author: typeof book.author === 'string' ? book.author : '',
      year: book.year || null,
      cover: typeof book.cover === 'string' ? book.cover : '',
      subjects: Array.isArray(book.subjects) ? book.subjects : [],
      averageRating: Number.isFinite(book.averageRating) ? book.averageRating : null,
    }),
  )
}

export function takePendingBookAdd() {
  const savedBook = sessionStorage.getItem(PENDING_BOOK_ADD_KEY)
  if (savedBook === null) return null

  sessionStorage.removeItem(PENDING_BOOK_ADD_KEY)
  const book = JSON.parse(savedBook)
  if (!book || typeof book.id !== 'string' || typeof book.title !== 'string') {
    throw new Error('The pending book could not be restored. Please add it again.')
  }

  return book
}
