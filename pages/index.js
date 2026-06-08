import { useState } from 'react'
import RequestForm from '../components/RequestForm'

export default function Home() {
  const [query, setQuery] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formKey, setFormKey] = useState(0)

  const closeResults = () => {
    if (results && results.success) {
      setFormKey(prev => prev + 1)
    }
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
      setResults(data)
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
          <p className="card-subtitle">Enter full name and farm location address to submit your request</p>
          <RequestForm key={formKey} onSearch={handleSearch} />
        </section>
      </main>

      {query && !results && !error && (
        <div className="result-modal" role="dialog" aria-modal="true">
          <div className="result-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
            <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>Submitting Request...</h3>
            <p style={{ margin: '0', color: '#334155' }}>Please wait while we send your information.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="result-modal" role="dialog" aria-modal="true" onMouseDown={closeResults}>
          <div className="result-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
            <h3 style={{ color: '#b91c1c', margin: '0 0 12px 0' }}>Submission Failed</h3>
            <p style={{ margin: '0 0 24px 0', color: '#b91c1c', wordBreak: 'break-word', lineHeight: '1.5' }}>{error}</p>
            <button className="btn" style={{ width: '100%', background: '#b91c1c' }} onClick={closeResults}>Try Again</button>
          </div>
        </div>
      )}

      {results && results.success && (
        <div className="result-modal" role="dialog" aria-modal="true" onMouseDown={closeResults}>
          <div className="result-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
            <h3 style={{ color: '#059669', margin: '0 0 12px 0' }}>Request Submitted</h3>
            <p style={{ margin: '0 0 24px 0', color: '#334155' }}>Your information has been successfully sent to the admin.</p>
            <button className="btn" onClick={closeResults} style={{ width: '100%' }}>Ok</button>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 Office for Agricultural Services</p>
          <p><strong>TechCraft by Chano</strong> | <a href="mailto:officialchano18@gmail.com">officialchano18@gmail.com</a></p>
        </div>
      </footer>
    </>
  )
}
