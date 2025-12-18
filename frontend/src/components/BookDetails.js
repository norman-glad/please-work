import { useState } from 'react'
import { useBookContext } from '../hooks/useBookContext'
import { useAuthContext } from '../hooks/useAuthContext'
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

const apiUrl = process.env.REACT_APP_API_URL

const BookDetails = ({ book }) => {
  const { dispatch } = useBookContext()
  const { user } = useAuthContext()

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(book.title)
  const [author, setAuthor] = useState(book.author)
  const [price, setPrice] = useState(book.price)
  const [yearPublished, setYearPublished] = useState(book.yearPublished)

  const handleDelete = async () => {
    if (!user) return

    const response = await fetch(`${apiUrl}/api/${book._id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
    const json = await response.json()

    if (response.ok) {
      dispatch({ type: 'DELETE_BOOK', payload: json })
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!user) return

    const updatedBook = { title, author, price, yearPublished }
    
    const response = await fetch(`${apiUrl}/api/${book._id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedBook),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      }
    })
    const json = await response.json()

    if (response.ok) {
      dispatch({ type: 'UPDATE_BOOK', payload: json })
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div className="book-details">
        <form onSubmit={handleUpdate}>
          <label>Title:</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          
          <label>Author:</label>
          <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} required />
          
          <label>Price:</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
          
          <label>Year Published:</label>
          <input type="number" value={yearPublished} onChange={(e) => setYearPublished(e.target.value)} required />
          
          <div className="form-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="book-details">
      <h4>{book.title}</h4>
      <p><strong>Author:</strong> {book.author}</p>
      <p><strong>Price:</strong> ${book.price}</p>
      <p><strong>Year:</strong> {book.yearPublished}</p>
      <p className="timestamp">
        {formatDistanceToNow(new Date(book.createdAt), { addSuffix: true })}
      </p>
      <div className="book-actions">
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <span className="material-symbols-outlined delete-btn" onClick={handleDelete}>
          delete
        </span>
      </div>
    </div>
  )
}

export default BookDetails