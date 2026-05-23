import { useState } from 'react'
import SearchForm from '../components/SearchForm'
import ResultCard from '../components/ResultCard'

export default function Home() {
  const [query, setQuery] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const closeResults = () => {
    setQuery(null)
    setResults(null)
    setLoading(false)
    setError(null)
  }

  const handleSearch = async (payload) => {
    setQuery(payload)
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || res.statusText)
      }

      const data = await res.json()
      // libsql returns rows as array; keep it as-is for ResultCard to render
      setResults(data.rows || [])
    } catch (err) {
      console.error('Search error', err)
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="hero-accent">
        <div className="container">
          <header className="hero">
              <div className="logo-row">
                <img src="/City.png" alt="City logo" className="logo" />
                <img src="/DA.png" alt="DA logo" className="logo" />
              </div>
              <div className="hero-text">
                <h1 className="title">Office for Agricultural Services</h1>
              </div>
            </header>
        </div>
      </div>

      <main className="container">
        <section className="card">
        <p className="card-subtitle">Enter full name and farm location address to find your record</p>
        <SearchForm onSearch={handleSearch} />
      </section>

      {query && (
        <ResultCard
          query={query}
          rows={results}
          loading={loading}
          error={error}
          onClose={closeResults}
        />
      )}
    </main>

    <footer className="footer">
      <div className="footer-content">
        <p>&copy; 2026 Office for Agricultural Services, City of Tabuk</p>
        <p><strong>Contact:</strong> (074) 627-5064 | matagoan@tabukcity.gov.ph</p>
        <p><strong>TechCraft by Chano</strong> | <a href="mailto:officialchano18@gmail.com">officialchano18@gmail.com</a></p>
      </div>
    </footer>
    </>
  )
}
