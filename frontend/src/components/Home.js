import React from 'react'
import './Home.css'
import { useNavigate } from 'react-router-dom'

const MainHome = () => {
  const navigate = useNavigate()

  return (
    <section className="landing">
      <div className="landing-content">
        <h1>Library Management</h1>
        <p>Find a variety of books that will satisfy your imagination</p>
        
        <div className="landing-buttons">
          <button onClick={() => navigate('/signup')} className="btn-primary">
            Get Started
          </button>
          <button onClick={() => navigate('/signin')} className="btn-secondary">
            Sign In
          </button>
        </div>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">📚</span>
            <h3>Browse Books</h3>
            <p>Explore our collection</p>
          </div>
          <div className="feature">
            <span className="feature-icon">➕</span>
            <h3>Add Books</h3>
            <p>Contribute to the library</p>
          </div>
          <div className="feature">
            <span className="feature-icon">✏️</span>
            <h3>Manage Collection</h3>
            <p>Edit and organize</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MainHome
