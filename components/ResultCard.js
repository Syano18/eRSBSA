import { useEffect } from 'react'

export default function ResultCard({ query, rows = [], loading = false, error = null, onClose }) {
  const fullName = query ? [query.firstName, query.middleInitial, query.lastName].filter(Boolean).join(' ') : ''
  const address = query ? [query.barangay, query.city, query.province].filter(Boolean).join(', ') : ''

  const getRowValue = (row, key, fallback = '') => {
    if (!row) return fallback
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== null && row[key] !== undefined && row[key] !== '') {
      return row[key]
    }
    return fallback
  }

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && onClose) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && onClose) {
      onClose()
    }
  }

  // --- NEW CLIENT-SIDE IMAGE GENERATOR ---
  const handleDownloadImage = async (row) => {
    try {
      // 1. Dynamically import html2canvas strictly on the client side
      const html2canvas = (await import('html2canvas')).default

      // 2. Format the specific row data
      const rowFullName = [getRowValue(row, 'first_name'), getRowValue(row, 'middle_initial'), getRowValue(row, 'last_name')]
        .filter(Boolean).join(' ')
      const rowAddress = [getRowValue(row, 'barangay'), 'City of Tabuk', 'Kalinga']
        .filter(Boolean).join(', ')

      // 3. Create an invisible HTML element in memory to act as our template
      const element = document.createElement('div')
      element.style.width = '695px'
      element.style.padding = '40px'
      element.style.backgroundColor = '#ffffff' // Ensure image has a solid white background
      element.style.fontFamily = 'Helvetica, Arial, sans-serif'
      element.style.color = '#000'
      // Position off-screen so it doesn't disrupt the user's view while rendering
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.top = '-9999px'

      // 4. Inject the data into the HTML structure
      element.innerHTML = `
        <div style="display: flex; align-items: center; padding-bottom: 10px; margin-bottom: 20px;">
          <img src="/DA.png" alt="DA Logo" style="width: 60px; height: 60px; margin-right: 15px;" />
          <div>
            <h1 style="margin: 0; font-size: 18px; font-weight: bold;">Department of Agriculture</h1>
            <p style="margin: 0; font-size: 14px;">Registry System for Basic Sectors in Agriculture (RSBSA)</p>
          </div>
        </div>

        <table style="width: 100%; margin-bottom: 30px; font-size: 14px; text-align: left;">
          <tbody>
            <tr>
              <td style="width: 200px; font-weight: bold; padding: 4px 0;">Name:</td>
              <td>${rowFullName || 'N/A'}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4px 0;">RSBSA Reference No:</td>
              <td>${getRowValue(row, 'ref_no', 'N/A')}</td>
            </tr>
            <tr>
              <td style="font-weight: bold; padding: 4px 0;">Farm Location Address:</td>
              <td>${rowAddress || 'N/A'}</td>
            </tr>
          </tbody>
        </table>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: center;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 8px; width: 25%;">GPX FILE NAME</th>
              <th style="border: 1px solid #000; padding: 8px; width: 15%;">CROP</th>
              <th style="border: 1px solid #000; padding: 8px; width: 25%;">PLANTING SCHEDULE</th>
              <th style="border: 1px solid #000; padding: 8px; width: 15%;">DECLARED SIZE</th>
              <th style="border: 1px solid #000; padding: 8px; width: 20%;">VERIFIED SIZE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #000; padding: 8px;">${getRowValue(row, 'gpx_file_name')}</td>
              <td style="border: 1px solid #000; padding: 8px;">${getRowValue(row, 'crop')}</td>
              <td style="border: 1px solid #000; padding: 8px;">${getRowValue(row, 'planting_schedule')}</td>
              <td style="border: 1px solid #000; padding: 8px;">${getRowValue(row, 'declared_size')}</td>
              <td style="border: 1px solid #000; padding: 8px;">${getRowValue(row, 'verified_size')}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #ddd; padding-top: 10px; font-size: 10px; color: #555;">
          <div style="text-align: left;">
            <strong style="color: #000;">This is an electronically generated document. No signature is required.</strong><br/>
            Issued by the Office For Agricultural Services - City of Tabuk
          </div>
          <div style="text-align: right;">
            Generated: ${new Date().toLocaleString()}
          </div>
        </div>
      `

      // 5. Append to body so html2canvas can properly calculate styles and auto-height
      document.body.appendChild(element)

      // 6. Generate the canvas from the HTML element
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      
      // Clean up the DOM
      document.body.removeChild(element)

      // 7. Convert to image and trigger download
      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      const link = document.createElement('a')
      link.href = imgData
      link.download = `RSBSA_${getRowValue(row, 'ref_no', 'record')}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (err) {
      console.error('Image generation error:', err)
      alert('Failed to generate Image. Please try again.')
    }
  }

  return (
    <div className="result-modal" role="dialog" aria-modal="true" aria-label="Search results" onMouseDown={handleBackdropClick}>
      <div className="result-card">
        <div className="result-header">
          <h3>Search results</h3>
          {onClose && (
            <button type="button" className="result-close" onClick={onClose} aria-label="Close results">
              ×
            </button>
          )}
        </div>

        {query && (
          <div className="result-summary">
            <p><strong>Submitted name:</strong> {fullName || '-'}</p>
            <p><strong>Submitted address:</strong> {address || '-'}</p>
          </div>
        )}

        {loading && <p>Searching&hellip;</p>}
        {error && <p className="error">Error: {error}</p>}

        {!loading && !error && rows && rows.length > 0 && (
          <div className="results-list">
            {rows.map((r, i) => (
              <div key={i} className="result-item">
                <p><strong>Ref No:</strong> {getRowValue(r, 'ref_no', '-')}</p>
                <p><strong>Name:</strong> {[getRowValue(r, 'first_name', ''), getRowValue(r, 'middle_initial', ''), getRowValue(r, 'last_name', '')].filter(Boolean).join(' ') || '-'}</p>
                <p><strong>Barangay:</strong> {getRowValue(r, 'barangay', '-')}</p>
                <p><strong>Crop:</strong> {getRowValue(r, 'crop', '-')}</p>
                <p><strong>Declared size:</strong> {getRowValue(r, 'declared_size', '-')} | <strong>Verified size:</strong> {getRowValue(r, 'verified_size', '-')}</p>
                <p><strong>Remarks:</strong> {getRowValue(r, 'remarks', '-')}</p>
                <button
                  type="button"
                  className="download-btn"
                  onClick={() => handleDownloadImage(r)}
                  aria-label="Download record as Image"
                >
                  📥 Download Record
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (!rows || rows.length === 0) && (
          <div className="placeholder">
            <em>No matching records found.</em>
          </div>
        )}
      </div>
    </div>
  )
}