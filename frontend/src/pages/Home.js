import { useEffect } from 'react'
import { useBookContext } from "../hooks/useBookContext"
import { useAuthContext } from "../hooks/useAuthContext"
import BookDetails from '../components/BookDetails'
import BookForm from '../components/BookForm'

const apiUrl = process.env.REACT_APP_API_URL

const Home = () => {
  const { books, dispatch } = useBookContext()
  const { user } = useAuthContext()

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(`${apiUrl}/api`, {
          headers: { 'Authorization': `Bearer ${user.token}` },
        })
        const json = await response.json()
        
        if (response.ok) {
          dispatch({ type: 'SET_BOOKS', payload: json })
        }
      } catch (error) {
        console.error('Failed to fetch books:', error)
      }
    }

    if (user) {
      fetchBooks()
    }
  }, [dispatch, user])

  return (
    <div className="home">
      <div className="books-list">
        {books && books.length > 0 ? (
          books.map((book) => <BookDetails key={book._id} book={book} />)
        ) : (
          <p>No books yet. Add one!</p>
        )}
      </div>
      <BookForm />
    </div>
  )
}

export default Home