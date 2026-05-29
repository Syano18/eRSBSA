import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

export default function AdminDashboard() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({})
  const [csvPreview, setCsvPreview] = useState(null)

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)

  const barangays = [
    'Agbannawag','Amlao','Appas','Bado Dangwa','Bagumbayan','Balawag','Balong','Bantay','Bulanao Centro','Bulanao Norte','Bulo','Cabaritan','Cabaruan','Calaccad','Calanan','Casigayan','Cudal','Dagupan Centro','Dagupan Weste','Dilag','Dupag','Gobgob','Guilayon','Ipil','Lacnog','Lacnog West','Lanna','Laya East','Laya West','Lucog','Magnao','Magsaysay','Malalao','Malin-awa','Masablang','Nambaran','Nambucayan','Naneng','New Tanglag','San Juan','San Julian','Suyang','Tuga'
  ]
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Check for stored token on initial load
    const storedToken = localStorage.getItem('adminToken')
    const expectedToken = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    if (storedToken === expectedToken) {
      setIsAuthenticated(true)
    }
  }, [])

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
    'Content-Type': 'application/json'
  })

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/records', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Unauthorized or failed to fetch')
      const data = await res.json()
      if (data.rows) setRecords(data.rows)
    } catch (err) {
      console.error('Failed to fetch records:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecords()
    }
  }, [isAuthenticated])

  const handleEdit = (record) => {
    setFormData(record)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) return
    try {
      await fetch(`/api/records?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() })
      fetchRecords() // Refresh the list
    } catch (err) {
      console.error('Failed to delete record:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const method = formData.id ? 'PUT' : 'POST'
    
    try {
      const res = await fetch('/api/records', {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) {
        return alert(data.error || 'Error saving record.')
      }
      setShowModal(false)
      setFormData({})
      fetchRecords() // Refresh the list
    } catch (err) {
      console.error('Failed to save record:', err)
      alert('Error saving record. Please try again.')
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  useEffect(() => {
    const handleOutside = (e) => {
      if (showDropdown && wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [showDropdown])

  const filteredBarangays = barangays.filter((b) => b.toLowerCase().includes((formData.barangay || '').toLowerCase()))

  const selectBarangay = (val) => {
    setFormData({ ...formData, barangay: val })
    setShowDropdown(false)
    setHighlightIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, filteredBarangays.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0 && highlightIndex < filteredBarangays.length) {
        selectBarangay(filteredBarangays[highlightIndex])
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    // Check environment variable or fallback to default password
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    if (password === adminPassword) {
      localStorage.setItem('adminToken', password)
      setIsAuthenticated(true)
      setLoginError(false)
    } else {
      setLoginError(true)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
    setPassword('')
  }

  const handleDownloadTemplate = () => {
    const headers = "ref_no,first_name,middle_initial,last_name,barangay,crop,planting_schedule,declared_size,verified_size,remarks,gpx_file_name\n"
    const blob = new Blob([headers], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'RSBSA_Import_Template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const parseCSVLine = (text) => {
    let ret = [], col = '', inQuote = false;
    for (let i = 0; i < text.length; i++) {
      let char = text[i];
      if (inQuote) {
        if (char === '"') {
          if (text[i + 1] === '"') { col += '"'; i++; } else { inQuote = false; }
        } else { col += char; }
      } else {
        if (char === '"') { inQuote = true; }
        else if (char === ',') { ret.push(col.trim()); col = ''; }
        else { col += char; }
      }
    }
    ret.push(col.trim());
    return ret;
  }

  const handleImportCSV = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target.result
      const lines = text.split(/\r?\n/).filter(line => line.trim())
      if (lines.length < 2) return alert('CSV file is empty or only contains headers.')

      const headers = parseCSVLine(lines[0])
      const records = lines.slice(1).map(line => {
        const values = parseCSVLine(line)
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] !== undefined ? values[index] : ''
          return obj
        }, {})
      })

      try {
        const res = await fetch('/api/records?preview=true', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(records) })
        const data = await res.json()
        if (!res.ok) {
          return alert(data.error || 'Error reading CSV for preview.')
        }
        setCsvPreview(data.previewRecords)
      } catch (err) {
        alert('Error analyzing CSV. Ensure fields match the template correctly.')
      } finally {
        e.target.value = null
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = async () => {
    const validRecords = csvPreview.filter(r => !r._isDuplicate).map(r => {
      const copy = { ...r }
      delete copy._isDuplicate
      return copy
    })

    if (validRecords.length === 0) {
      alert('No valid records to import. All entries are duplicates.')
      setCsvPreview(null)
      return
    }

    try {
      const res = await fetch('/api/records', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(validRecords) })
      const data = await res.json()
      if (!res.ok) {
        return alert(data.error || 'Error importing CSV.')
      }
      alert(`Successfully imported ${data.count} records.`)
      setCsvPreview(null)
      fetchRecords()
    } catch (err) {
      alert('Error saving CSV records.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
        <Head>
          <title>Admin Login - eRSBSA</title>
        </Head>
        <div className="logo-row" style={{ marginBottom: '24px' }}>
          <img src="/City.png" alt="City logo" className="logo" />
          <img src="/DA.png" alt="DA logo" className="logo" />
        </div>
        <div className="card">
          <h2 className="title" style={{ textAlign: 'center', marginBottom: '16px' }}>Admin Login</h2>
          <form onSubmit={handleLogin} className="form-grid">
            <label className="label">
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="Enter admin password" required autoFocus />
            </label>
            {loginError && <p className="error" style={{ fontSize: '0.9rem', margin: '0' }}>Incorrect password.</p>}
            <button type="submit" className="btn" style={{ marginTop: '8px' }}>Login</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: '1100px' }}>
      <Head>
        <title>Admin Dashboard - eRSBSA</title>
      </Head>
      
      <div className="hero">
        <div className="logo-row">
          <img src="/City.png" alt="City logo" className="logo" />
          <img src="/DA.png" alt="DA logo" className="logo" />
        </div>
        <h1 className="title">Admin Dashboard</h1>
        <p className="subtitle">Manage and update RSBSA Records</p>
      </div>

      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <button className="btn" style={{ background: 'var(--muted)', color: 'var(--text)' }} onClick={handleLogout}>
          Logout
        </button>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn" style={{ background: '#3b82f6' }} onClick={handleDownloadTemplate}>
            Download Template
          </button>
          <button className="btn" style={{ background: '#eab308', color: '#fff' }} onClick={() => fileInputRef.current?.click()}>
            Import CSV
          </button>
          <button className="btn" onClick={() => { setFormData({}); setShowModal(true) }}>
            + Add New Record
          </button>
        </div>
      </div>
      <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportCSV} />

      <div className="panel" style={{ width: '100%', overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Loading records...</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ref No</th>
                <th>Name</th>
                <th>Barangay</th>
                <th>Crop</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{r.ref_no || '-'}</td>
                  <td>{[r.first_name, r.middle_initial, r.last_name].filter(Boolean).join(' ') || '-'}</td>
                  <td>{r.barangay || '-'}</td>
                  <td>{r.crop || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn btn-sm" onClick={() => handleEdit(r)} style={{ marginRight: '8px' }}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No records found in the database.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Reuse result-modal styles for the Add/Edit Form Overlay */}
      {showModal && (
        <div className="result-modal" onMouseDown={(e) => { if(e.target === e.currentTarget) setShowModal(false) }}>
          <div className="result-card" style={{ maxWidth: '700px' }}>
            <div className="result-header">
              <h3>{formData.id ? 'Edit Record' : 'Add New Record'}</h3>
              <button className="result-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="form-grid">
              <label className="label">Ref No<input name="ref_no" value={formData.ref_no || ''} onChange={handleChange} className="input" required /></label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <label className="label">First Name<input name="first_name" value={formData.first_name || ''} onChange={handleChange} className="input" required /></label>
                <label className="label">M.I.<input name="middle_initial" value={formData.middle_initial || ''} onChange={handleChange} className="input" /></label>
                <label className="label">Last Name<input name="last_name" value={formData.last_name || ''} onChange={handleChange} className="input" required /></label>
              </div>
              
              <label className="label">
                Barangay
                <div className="select-wrapper" ref={wrapperRef}>
                  <input
                    name="barangay"
                    className="input"
                    value={formData.barangay || ''}
                    onChange={(e) => { setFormData({ ...formData, barangay: e.target.value }); setShowDropdown(true); setHighlightIndex(-1); }}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Select barangay"
                    required
                    aria-autocomplete="list"
                    aria-haspopup="true"
                  />
                  {showDropdown && (
                    <ul className="dropdown-list" role="listbox">
                      {filteredBarangays.length === 0 && <li className="dropdown-item">No results</li>}
                      {filteredBarangays.map((b, idx) => (
                        <li
                          key={b}
                          role="option"
                          aria-selected={highlightIndex === idx}
                          className={`dropdown-item ${highlightIndex === idx ? 'highlight' : ''}`}
                          onMouseDown={(ev) => { ev.preventDefault(); selectBarangay(b) }}
                          onMouseEnter={() => setHighlightIndex(idx)}
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <label className="label">Crop<input name="crop" value={formData.crop || ''} onChange={handleChange} className="input" /></label>
                <label className="label">Planting Schedule<input name="planting_schedule" value={formData.planting_schedule || ''} onChange={handleChange} className="input" /></label>
                <label className="label">Declared Size<input name="declared_size" value={formData.declared_size || ''} onChange={handleChange} className="input" /></label>
                <label className="label">Verified Size<input name="verified_size" value={formData.verified_size || ''} onChange={handleChange} className="input" /></label>
              </div>
              
              <label className="label">GPX File Name<input name="gpx_file_name" value={formData.gpx_file_name || ''} onChange={handleChange} className="input" /></label>
              <label className="label">Remarks<input name="remarks" value={formData.remarks || ''} onChange={handleChange} className="input" /></label>
              
              <div className="actions" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn" style={{ background: 'var(--muted)', color: 'var(--text)' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn">{formData.id ? 'Update Record' : 'Save New Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Preview Modal */}
      {csvPreview && (
        <div className="result-modal" onMouseDown={(e) => { if(e.target === e.currentTarget) setCsvPreview(null) }}>
          <div className="result-card" style={{ maxWidth: '1000px', width: '100%' }}>
            <div className="result-header">
              <h3>CSV Import Preview</h3>
              <button className="result-close" onClick={() => setCsvPreview(null)} aria-label="Close">×</button>
            </div>
            <p style={{ marginBottom: '16px', color: '#475569' }}>
              Review the records before importing. Duplicates are flagged and will be ignored.
            </p>

            <div className="panel" style={{ overflow: 'auto', maxHeight: '50vh', marginBottom: '16px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Ref No</th>
                    <th>Name</th>
                    <th>Barangay</th>
                    <th>Crop</th>
                    <th>Sizes (Dec/Ver)</th>
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.map((r, i) => (
                    <tr key={i} style={{ backgroundColor: r._isDuplicate ? 'rgba(220, 38, 38, 0.05)' : 'transparent' }}>
                      <td>
                        {r._isDuplicate 
                          ? <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '0.8rem' }}>Duplicate</span>
                          : <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.8rem' }}>Valid</span>}
                      </td>
                      <td>{r.ref_no || '-'}</td>
                      <td>{[r.first_name, r.middle_initial, r.last_name].filter(Boolean).join(' ') || '-'}</td>
                      <td>{r.barangay || '-'}</td>
                      <td>{r.crop || '-'}</td>
                      <td>{r.declared_size || '-'} / {r.verified_size || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
              <button type="button" className="btn" style={{ background: 'var(--muted)', color: 'var(--text)' }} onClick={() => setCsvPreview(null)}>Cancel</button>
              <button type="button" className="btn" onClick={handleConfirmImport}>
                Confirm & Import {csvPreview.filter(r => !r._isDuplicate).length} Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}