import { useState } from "react"
import { useBookContext } from "../hooks/useBookContext"
import { useAuthContext } from '../hooks/useAuthContext'

const apiUrl = process.env.REACT_APP_API_URL

const BookForm = () => {
  const { dispatch } = useBookContext()
  const { user } = useAuthContext()

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [price, setPrice] = useState('')
  const [yearPublished, setYearPublished] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      setError('You must be logged in')
      return
    }

    const book = { title, author, price, yearPublished }

    const response = await fetch(`${apiUrl}/api`, {
      method: 'POST',
      body: JSON.stringify(book),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    })
    const json = await response.json()

    if (!response.ok) {
      setError(json.error || 'Failed to add book')
    } else {
      // clear form on success
      setTitle('')
      setAuthor('')
      setPrice('')
      setYearPublished('')
      setError(null)
      dispatch({ type: 'CREATE_BOOK', payload: json })
    }
  }

  return (
    <form className="create" onSubmit={handleSubmit}>
      <h3>Add a New Book</h3>

      <label>Book Title:</label>
      <input
        type="text"
        onChange={(e) => setTitle(e.target.value)}
        value={title}
        required
      />

      <label>Author Name:</label>
      <input
        type="text"
        onChange={(e) => setAuthor(e.target.value)}
        value={author}
        required
      />

      <label>Price:</label>
      <input
        type="number"
        onChange={(e) => setPrice(e.target.value)}
        value={price}
        required
      />

      <label>Year Published:</label>
      <input
        type="number"
        onChange={(e) => setYearPublished(e.target.value)}
        value={yearPublished}
        required
      />

      <button>Add Book</button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}

export default BookForm