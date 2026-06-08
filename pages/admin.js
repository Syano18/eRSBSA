import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

export default function AdminDashboard() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState(false)

  const [selectedRecord, setSelectedRecord] = useState(null)
  const [reviewForm, setReviewForm] = useState({
    refNo: '',
    parcels: [{
      gpxFileName: '',
      landTenure: '',
      parcelName: '',
      crop: '',
      plantingSchedule: '',
      declaredSize: '',
      verifiedSize: '',
      remarks: ''
    }]
  })

  const [notification, setNotification] = useState(null)
  const [previewImages, setPreviewImages] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null)
  const [dropdownHighlightIndex, setDropdownHighlightIndex] = useState(-1)
  const dropdownRef = useRef(null)
  const landTenureOptions = ['Registered Owner', 'Tenant', 'Mortgage', 'Lessee']

  useEffect(() => {
    const handleOutside = (e) => {
      if (activeDropdownIndex !== null && dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdownIndex(null)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [activeDropdownIndex])

  useEffect(() => {
    // Check for stored token on initial load
    const storedToken = localStorage.getItem('adminToken')
    if (storedToken && storedToken.length > 20) { // Simple check to see if it looks like a JWT
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

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError(false)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!res.ok) {
        throw new Error('Invalid credentials')
      }

      const data = await res.json()
      if (data.success && data.token) {
        localStorage.setItem('adminToken', data.token)
        setIsAuthenticated(true)
      } else {
        setLoginError(true)
      }
    } catch (err) {
      console.error('Login error:', err)
      setLoginError(true)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  const handleReview = (record) => {
    setSelectedRecord(record)
    setReviewForm({
      refNo: '',
      parcels: [{
        gpxFileName: '',
        landTenure: '',
        parcelName: '',
        crop: '',
        plantingSchedule: '',
        declaredSize: '',
        verifiedSize: '',
        remarks: ''
      }]
    })
  }

  const handleReviewChange = (e) => {
    const { name, value } = e.target
    setReviewForm(prev => ({ ...prev, [name]: value }))
  }

  const handleParcelChange = (index, e) => {
    const { name, value } = e.target
    setReviewForm(prev => {
      const newParcels = [...prev.parcels]
      newParcels[index] = { ...newParcels[index], [name]: value }
      return { ...prev, parcels: newParcels }
    })
  }

  const handleParcelDecimalBlur = (index, e) => {
    const { name, value } = e.target
    if (value !== '' && !isNaN(value)) {
      setReviewForm(prev => {
        const newParcels = [...prev.parcels]
        newParcels[index] = { ...newParcels[index], [name]: parseFloat(value).toFixed(2) }
        return { ...prev, parcels: newParcels }
      })
    }
  }

  const addParcel = () => {
    const lastIndex = reviewForm.parcels.length - 1

    const requiredFields = ['gpxFileName', 'landTenure', 'parcelName', 'crop', 'plantingSchedule', 'declaredSize', 'verifiedSize']
    for (const field of requiredFields) {
      const el = document.getElementById(`parcel-${lastIndex}-${field}`)
      if (el && !el.checkValidity()) {
        el.reportValidity()
        return
      }
    }
    setReviewForm(prev => ({
      ...prev,
      parcels: [...prev.parcels, { gpxFileName: '', landTenure: '', parcelName: '', crop: '', plantingSchedule: '', declaredSize: '', verifiedSize: '', remarks: '' }]
    }))
  }

  const removeParcel = (index) => {
    setReviewForm(prev => ({
      ...prev,
      parcels: prev.parcels.filter((_, i) => i !== index)
    }))
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setIsGenerating(true)

    try {
      const html2canvas = (await import('html2canvas')).default

      const rowFullName = [selectedRecord.first_name, selectedRecord.middle_initial, selectedRecord.last_name].filter(Boolean).join(' ')
      const rowAddress = [selectedRecord.barangay, selectedRecord.city, selectedRecord.province, selectedRecord.region].filter(Boolean).join(', ')
      const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '-9999px'
      container.style.overflow = 'hidden'
      container.style.display = 'flex'
      container.style.flexDirection = 'column'
      container.style.gap = '40px'
      container.style.width = '794px' // A4 standard width

      const setupPageElement = () => {
        const el = document.createElement('div')
        el.style.padding = '40px'
        el.style.boxSizing = 'border-box'
        el.style.backgroundColor = '#ffffff'
        el.style.fontFamily = 'Helvetica, Arial, sans-serif'
        el.style.color = '#000'
        return el
      }

      const ocasElement = setupPageElement()
      ocasElement.innerHTML = `
        <div style="border: 1px solid #000; padding: 40px; display: flex; flex-direction: column; position: relative; background: #fff;">
          <!-- FIELD ASSISTANT LOGBOOK -->
          <div style="position: relative; display: flex; flex-direction: column;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.12; pointer-events: none; z-index: 0;">
              <img src="/DA.png" alt="DA Watermark" style="width: 300px; height: 300px; object-fit: contain;" />
            </div>
            <div style="position: relative; z-index: 1; display: flex; flex-direction: column;">
              <div style="text-align: center; margin-bottom: 20px; font-family: serif;">
              <div style="font-weight: bold; font-size: 16px;">FIELD ASSISTANT LOGBOOK</div>
              <div style="font-size: 14px;">FA Code: __________________</div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px;">
              <div>Contact No.: 09</div>
              <div style="display: flex; align-items: flex-end;">
                <span style="white-space: nowrap; margin-right: 5px;">Date:</span>
                <span style="border-bottom: 1px solid #000; min-width: 150px; text-align: center;">${currentDate}</span>
              </div>
            </div>
            <div style="font-size: 14px; margin-bottom: 15px; display: flex;">
              <span style="white-space: nowrap; margin-right: 5px;">Farmer's Address:</span>
              <span style="flex: 1; border-bottom: 1px solid #000;">${rowAddress || ''}</span>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: center; margin-bottom: 15px;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 8px; width: 15%;">GPX ID NUMBER</th>
                  <th style="border: 1px solid #000; padding: 8px; width: 10%;">LAND<br/>TENURE</th>
                  <th style="border: 1px solid #000; padding: 8px; width: 25%;">PARCEL NAME/<br/>LAND OWNER</th>
                  <th style="border: 1px solid #000; padding: 8px; width: 15%;">CROP</th>
                  <th style="border: 1px solid #000; padding: 8px; width: 10%;">DECLARED<br/>SIZE</th>
                  <th style="border: 1px solid #000; padding: 8px; width: 10%;">VERIFIED<br/>SIZE</th>
                  <th style="border: 1px solid #000; padding: 8px; width: 15%;">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                ${reviewForm.parcels.map(p => `
                <tr>
                  <td style="border: 1px solid #000; padding: 6px;">${p.gpxFileName}</td>
                  <td style="border: 1px solid #000; padding: 6px;">${p.landTenure}</td>
                  <td style="border: 1px solid #000; padding: 6px;">${p.parcelName}</td>
                  <td style="border: 1px solid #000; padding: 6px;">${p.crop}</td>
                  <td style="border: 1px solid #000; padding: 6px;">${p.declaredSize}</td>
                  <td style="border: 1px solid #000; padding: 6px;">${p.verifiedSize}</td>
                  <td style="border: 1px solid #000; padding: 6px;">${p.remarks}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div style="text-align: center; font-size: 12px; margin-bottom: 25px;">
              By signing it, I hereby certify that I give consent to the data gathering and attest that all information<br/>is true and correct.
            </div>
            
            <div style="display: flex; justify-content: space-around; font-size: 12px; margin-bottom: 0;">
              <div style="text-align: center; width: 40%;">
                <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px;"></div>
                <div>Farmer's Signature over Printed Name</div>
              </div>
              <div style="text-align: center; width: 40%;">
                <div style="border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
                  <img src="/Head.png" alt="AEW Signature" style="width: 190px; height: auto; max-width: none; margin-top: -20px; margin-bottom: -5px; position: relative; z-index: 10;" />
                </div>
                <div>AEW's Signature over Printed Name</div>
              </div>
            </div>
            </div>
          </div>

          <div style="border-bottom: 1px solid #000; margin: 30px -40px 30px -40px;"></div>

          <!-- RSBSA COPY -->
          <div style="position: relative; flex: 1; display: flex; flex-direction: column;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.12; pointer-events: none; z-index: 0;">
              <img src="/DA.png" alt="DA Watermark" style="width: 300px; height: 300px; object-fit: contain;" />
            </div>
            <div style="position: relative; z-index: 1; display: flex; flex-direction: column; flex: 1;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                <div style="display: flex; align-items: center;">
                  <img src="/DA.png" alt="DA Logo" style="width: 40px; height: 40px; margin-right: 10px;" />
                  <div>
                    <h1 style="margin: 0; font-size: 16px; font-weight: normal;">Department of Agriculture</h1>
                    <p style="margin: 0; font-size: 14px; font-weight: bold;">Registry System for Basic Sectors in Agriculture (RSBSA)</p>
                  </div>
                </div>
                <div style="border: 1px solid blue; color: blue; width: 220px; padding: 5px; display: flex; align-items: center; box-sizing: border-box;">
                  <img src="/DA.png" alt="DA Logo" style="width: 36px; height: 36px; margin-right: 8px;" />
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                    <img src="/Head.png" alt="Head Signature" style="width: 160px; height: auto; max-width: none; margin-top: -20px; margin-bottom: -5px; position: relative; z-index: 10;" />
                    <div style="width: 100%; font-size: 9px; display: flex; flex-direction: column;">
                      <div style="border-top: 1px solid blue; border-bottom: 1px solid blue; text-align: center; padding-top: 2px; padding-bottom: 2px; margin-bottom: 2px;">
                        <div style="margin-bottom: 15px;">CERTIFIED BY:</div>
                        <div style="color: #000; font-size: 14px;">${currentDate}</div>
                      </div>
                      <div style="text-align: center;">DATE</div>
                    </div>
                  </div>
                </div>
              </div>

              <table style="width: 100%; margin-bottom: 20px; font-size: 14px; border-collapse: separate; border-spacing: 0 8px;">
                <tbody>
                  <tr>
                    <td style="width: 1%; white-space: nowrap;">Name:</td>
                    <td style="border-bottom: 1px solid #000; padding-left: 10px;">${rowFullName || ''}</td>
                  </tr>
                  <tr>
                    <td style="width: 1%; white-space: nowrap;">RSBSA Reference No.:</td>
                    <td style="border-bottom: 1px solid #000; padding-left: 10px;">${reviewForm.refNo || ''}</td>
                  </tr>
                  <tr>
                    <td style="width: 1%; white-space: nowrap;">Farm Location Address:</td>
                    <td style="border-bottom: 1px solid #000; padding-left: 10px;">${rowAddress || ''}</td>
                  </tr>
                </tbody>
              </table>

              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: center; margin-bottom: 40px;">
                <thead>
                  <tr>
                    <th style="border: 1px solid #000; padding: 10px; width: 30%;">GPX FILE NAME</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 20%;">CROP</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 20%;">PLANTING SCHEDULE</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 15%;">DECLARED<br/>SIZE</th>
                    <th style="border: 1px solid #000; padding: 10px; width: 15%;">VERIFIED<br/>SIZE</th>
                  </tr>
                </thead>
                <tbody>
                  ${reviewForm.parcels.map(p => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px;">${p.gpxFileName}</td>
                    <td style="border: 1px solid #000; padding: 8px;">${p.crop}</td>
                    <td style="border: 1px solid #000; padding: 8px;">${p.plantingSchedule}</td>
                    <td style="border: 1px solid #000; padding: 8px;">${p.declaredSize}</td>
                    <td style="border: 1px solid #000; padding: 8px;">${p.verifiedSize}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 14px;">
                <div style="font-family: serif; font-weight: bold;">RSBSA COPY</div>
                <div style="text-align: center; font-size: 12px;">
                  <div style="border-bottom: 1px solid #000; width: 300px; margin-bottom: 4px;"></div>
                  <div>Farmer's Signature over Printed Name</div>
                </div>
                <div style="width: 120px;"></div>
              </div>
            </div>
          </div>
        </div>
      `

      const farmerElement = setupPageElement()
      farmerElement.innerHTML = `
        <div style="border: 1px solid #000; padding: 40px; display: flex; flex-direction: column; position: relative; background: #fff;">
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.12; pointer-events: none; z-index: 0;">
            <img src="/DA.png" alt="DA Watermark" style="width: 300px; height: 300px; object-fit: contain;" />
          </div>
          <div style="position: relative; z-index: 1; display: flex; flex-direction: column; flex: 1;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <div style="display: flex; align-items: center;">
              <img src="/DA.png" alt="DA Logo" style="width: 40px; height: 40px; margin-right: 10px;" />
              <div>
                <h1 style="margin: 0; font-size: 16px; font-weight: normal;">Department of Agriculture</h1>
                <p style="margin: 0; font-size: 14px; font-weight: bold;">Registry System for Basic Sectors in Agriculture (RSBSA)</p>
              </div>
            </div>
            <div style="border: 1px solid blue; color: blue; width: 220px; padding: 5px; display: flex; align-items: center; box-sizing: border-box;">
              <img src="/DA.png" alt="DA Logo" style="width: 36px; height: 36px; margin-right: 8px;" />
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                <img src="/Head.png" alt="Head Signature" style="width: 160px; height: auto; max-width: none; margin-top: -20px; margin-bottom: -5px; position: relative; z-index: 10;" />
                <div style="width: 100%; font-size: 9px; display: flex; flex-direction: column;">
                  <div style="border-top: 1px solid blue; border-bottom: 1px solid blue; text-align: center; padding-top: 2px; padding-bottom: 2px; margin-bottom: 2px;">
                    <div style="margin-bottom: 15px;">CERTIFIED BY:</div>
                    <div style="color: #000; font-size: 14px;">${currentDate}</div>
                  </div>
                  <div style="text-align: center;">DATE</div>
                </div>
              </div>
            </div>
          </div>

          <table style="width: 100%; margin-bottom: 20px; font-size: 14px; border-collapse: separate; border-spacing: 0 8px;">
            <tbody>
              <tr>
                <td style="width: 1%; white-space: nowrap;">Name:</td>
                <td style="border-bottom: 1px solid #000; padding-left: 10px;">${rowFullName || ''}</td>
              </tr>
              <tr>
                <td style="width: 1%; white-space: nowrap;">RSBSA Reference No.:</td>
                <td style="border-bottom: 1px solid #000; padding-left: 10px;">${reviewForm.refNo || ''}</td>
              </tr>
              <tr>
                <td style="width: 1%; white-space: nowrap;">Farm Location Address:</td>
                <td style="border-bottom: 1px solid #000; padding-left: 10px;">${rowAddress || ''}</td>
              </tr>
            </tbody>
          </table>

          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: center; margin-bottom: 40px;">
            <thead>
              <tr>
                <th style="border: 1px solid #000; padding: 10px; width: 30%;">GPX FILE NAME</th>
                <th style="border: 1px solid #000; padding: 10px; width: 20%;">CROP</th>
                <th style="border: 1px solid #000; padding: 10px; width: 20%;">PLANTING SCHEDULE</th>
                <th style="border: 1px solid #000; padding: 10px; width: 15%;">DECLARED<br/>SIZE</th>
                <th style="border: 1px solid #000; padding: 10px; width: 15%;">VERIFIED<br/>SIZE</th>
              </tr>
            </thead>
            <tbody>
              ${reviewForm.parcels.map(p => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">${p.gpxFileName}</td>
                <td style="border: 1px solid #000; padding: 8px;">${p.crop}</td>
                <td style="border: 1px solid #000; padding: 8px;">${p.plantingSchedule}</td>
                <td style="border: 1px solid #000; padding: 8px;">${p.declaredSize}</td>
                <td style="border: 1px solid #000; padding: 8px;">${p.verifiedSize}</td>
              </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 14px;">
            <div style="font-family: serif; font-weight: bold;">FARMER'S COPY</div>
            <div style="text-align: center; font-size: 12px;">
              <div style="border-bottom: 1px solid #000; width: 300px; margin-bottom: 4px;"></div>
              <div>Farmer's Signature over Printed Name</div>
            </div>
            <div style="width: 120px;"></div>
          </div>
        </div>
      `

      container.appendChild(ocasElement)
      container.appendChild(farmerElement)
      document.body.appendChild(container)

      const combinedCanvas = await html2canvas(container, { scale: 2, useCORS: true })
      const farmerCanvas = await html2canvas(farmerElement, { scale: 2, useCORS: true })
      document.body.removeChild(container)

      setPreviewImages({
        combined: combinedCanvas.toDataURL('image/jpeg', 0.98),
        farmer: farmerCanvas.toDataURL('image/jpeg', 0.98)
      })
    } catch (err) {
      console.error('Image generation error:', err)
      setNotification({ type: 'error', message: 'Failed to generate Image. Please try again.' })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!previewImages) return
    setIsSending(true)

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: selectedRecord.email,
          image: previewImages.farmer,
          refNo: reviewForm.refNo
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to send email')
      }

      const link = document.createElement('a')
      link.href = previewImages.combined

      const fullName = [selectedRecord.first_name, selectedRecord.middle_initial, selectedRecord.last_name].filter(Boolean).join(' ')
      const dateIssued = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).replace(/,/g, '')
      link.download = `RSBSA_Stub_${fullName}_${dateIssued}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Delete the request from the database
      const deleteRes = await fetch(`/api/records?id=${selectedRecord.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (!deleteRes.ok) {
        console.error('Failed to delete record from database')
        setNotification({ type: 'error', message: 'Email sent & OCAS downloaded, but failed to delete request from database.' })
      } else {
        // Remove from local state
        setRecords(prev => prev.filter(r => r.id !== selectedRecord.id))
        setNotification({ type: 'success', message: 'Request processed and removed successfully!' })
      }

      setPreviewImages(null)
      setSelectedRecord(null) // Close the review modal
    } catch (err) {
      setNotification({ type: 'error', message: err.message })
    } finally {
      setIsSending(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin Login - eRSBSA</title>
        </Head>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          padding: '24px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '440px',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
                <img src="/City.png" alt="City logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
                <img src="/DA.png" alt="DA logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
              </div>
              <h2 style={{ textAlign: 'center', margin: '0 0 8px 0', fontSize: '1.75rem', color: '#0f172a', fontWeight: '700' }}>Welcome Back</h2>
              <p style={{ textAlign: 'center', margin: '0 0 32px 0', color: '#64748b', fontSize: '0.95rem' }}>Sign in to access the eRSBSA Admin Dashboard</p>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                    placeholder="Enter admin username"
                    required
                    autoFocus
                    onFocus={(e) => e.target.style.borderColor = '#16a34a'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                      placeholder="Enter admin password"
                      required
                      onFocus={(e) => e.target.style.borderColor = '#16a34a'}
                      onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', color: '#b91c1c', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    Invalid username or password.
                  </div>
                )}

                <button type="submit" style={{ width: '100%', padding: '14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '8px', transition: 'background 0.2s, transform 0.1s' }} onMouseEnter={(e) => e.target.style.background = '#15803d'} onMouseLeave={(e) => e.target.style.background = '#16a34a'} onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'} onMouseUp={(e) => e.target.style.transform = 'scale(1)'}>
                  Sign In
                </button>
              </form>
            </div>
            <div style={{ background: '#f8fafc', padding: '20px', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}> &copy; 2026 Office for Agricultural Services</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#0c0c0cff' }}>TechCraft by Chano | <a href="mailto:officialchano18@gmail.com">officialchano18@gmail.com</a></p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - eRSBSA</title>
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-green-50)' }}>
        {/* Sidebar */}
        <aside style={{ width: '260px', background: 'white', borderRight: '1px solid var(--muted)', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '24px' }}>
          <div className="logo-row" style={{ marginBottom: '24px' }}>
            <img src="/City.png" alt="City logo" className="logo" style={{ width: '56px' }} />
            <img src="/DA.png" alt="DA logo" className="logo" style={{ width: '56px' }} />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h1 className="title" style={{ fontSize: '1.5rem', textAlign: 'left' }}>Admin Dashboard</h1>
            <p className="subtitle" style={{ margin: '4px 0 0', textAlign: 'left', fontSize: '0.9rem' }}>
              View User Requests
            </p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <button
              className="sidebar-link active"
              onClick={() => { }}
            >
              Requests
            </button>
          </nav>

          <button className="btn" style={{ background: 'var(--muted)', color: 'var(--text)', marginTop: 'auto' }} onClick={handleLogout}>
            Logout
          </button>
        </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '32px 40px', overflowY: 'auto', flex: 1 }}>
            <div className="card" style={{ width: '100%', maxWidth: '100%', padding: '0', overflow: 'hidden' }}>
              <div style={{ width: '100%', overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                {loading ? (
                  <p style={{ textAlign: 'center', padding: '40px' }}>Loading requests...</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Region</th>
                        <th>Barangay</th>
                        <th>Submitted At</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => (
                        <tr key={r.id}>
                          <td>{[r.first_name, r.middle_initial, r.last_name].filter(Boolean).join(' ') || '-'}</td>
                          <td>{r.email || '-'}</td>
                          <td>{r.region || '-'}</td>
                          <td>{r.barangay || '-'}</td>
                          <td>{new Date(r.created_at).toLocaleString() || '-'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-sm" onClick={() => handleReview(r)}>Open Request</button>
                          </td>
                        </tr>
                      ))}
                      {records.length === 0 && (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No requests found in the database.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Review and Edit Modal */}
      {selectedRecord && (
        <div className="result-modal" role="dialog" aria-modal="true" onMouseDown={() => setSelectedRecord(null)}>
          <form className="result-card" style={{ maxWidth: '650px', padding: '32px' }} onMouseDown={(e) => e.stopPropagation()} onSubmit={handleGenerate}>
            <div className="result-header" style={{ marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.25rem' }}>Review Request</h3>
              <button type="button" className="result-close" onClick={() => setSelectedRecord(null)}>×</button>
            </div>

            <div className="result-summary" style={{ marginBottom: '24px', background: 'var(--color-green-50)', borderColor: 'var(--color-green-200)' }}>
              <p style={{ margin: '4px 0' }}><strong>Name:</strong> {[selectedRecord.first_name, selectedRecord.middle_initial, selectedRecord.last_name].filter(Boolean).join(' ') || '-'}</p>
              <p style={{ margin: '4px 0' }}><strong>Farm Location:</strong> {[selectedRecord.barangay, selectedRecord.city, selectedRecord.province, selectedRecord.region].filter(Boolean).join(', ') || '-'}</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="label">
                RSBSA Reference No.:
                <input type="text" id="refNo" name="refNo" value={reviewForm.refNo} onChange={handleReviewChange} className="input" required />
              </label>
            </div>

            {reviewForm.parcels.map((parcel, index) => (
              <div key={index} style={{ marginBottom: '24px', padding: '24px', border: '1px solid var(--muted)', borderRadius: '12px', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem' }}>Parcel {index + 1}</h4>
                  {reviewForm.parcels.length > 1 && (
                    <button type="button" onClick={() => removeParcel(index)} className="btn btn-sm btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Remove</button>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <label className="label">
                    GPX File name
                    <input type="text" id={`parcel-${index}-gpxFileName`} name="gpxFileName" value={parcel.gpxFileName} onChange={(e) => handleParcelChange(index, e)} className="input" style={{ background: 'white' }} required />
                  </label>
                  <label className="label">
                    Land Tenure
                    <div className="select-wrapper" ref={activeDropdownIndex === index ? dropdownRef : null}>
                      <input
                        type="text"
                        id={`parcel-${index}-landTenure`}
                        name="landTenure"
                        value={parcel.landTenure}
                        onChange={(e) => {
                          handleParcelChange(index, e)
                          setActiveDropdownIndex(index)
                          setDropdownHighlightIndex(-1)
                        }}
                        onFocus={() => {
                          setActiveDropdownIndex(index)
                          setDropdownHighlightIndex(-1)
                          handleParcelChange(index, { target: { name: 'landTenure', value: '' } })
                        }}
                        onKeyDown={(e) => {
                          if (activeDropdownIndex !== index) return
                          const filtered = landTenureOptions.filter(o => o.toLowerCase().includes((parcel.landTenure || '').toLowerCase()))
                          if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            setDropdownHighlightIndex(i => Math.min(i + 1, filtered.length - 1))
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setDropdownHighlightIndex(i => Math.max(i - 1, 0))
                          } else if (e.key === 'Enter') {
                            e.preventDefault()
                            if (dropdownHighlightIndex >= 0 && dropdownHighlightIndex < filtered.length) {
                              handleParcelChange(index, { target: { name: 'landTenure', value: filtered[dropdownHighlightIndex] } })
                              setActiveDropdownIndex(null)
                            }
                          } else if (e.key === 'Escape') {
                            setActiveDropdownIndex(null)
                          }
                        }}
                        className="input"
                        style={{ background: 'white' }}
                        placeholder="Select or search..."
                        required
                        autoComplete="off"
                        aria-autocomplete="list"
                        aria-haspopup="true"
                      />
                      {activeDropdownIndex === index && (
                        <ul className="dropdown-list" role="listbox" style={{ zIndex: 10 }}>
                          {(() => {
                            const filtered = landTenureOptions.filter(o => o.toLowerCase().includes((parcel.landTenure || '').toLowerCase()))
                            if (filtered.length === 0) return <li className="dropdown-item">No results</li>
                            return filtered.map((o, idx) => (
                              <li
                                key={o}
                                role="option"
                                aria-selected={dropdownHighlightIndex === idx}
                                className={`dropdown-item ${dropdownHighlightIndex === idx ? 'highlight' : ''}`}
                                onMouseDown={(ev) => {
                                  ev.preventDefault()
                                  handleParcelChange(index, { target: { name: 'landTenure', value: o } })
                                  setActiveDropdownIndex(null)
                                }}
                                onMouseEnter={() => setDropdownHighlightIndex(idx)}
                              >
                                {o}
                              </li>
                            ))
                          })()}
                        </ul>
                      )}
                    </div>
                  </label>
                  <label className="label">
                    Parcel Name/Land Owner
                    <input type="text" id={`parcel-${index}-parcelName`} name="parcelName" value={parcel.parcelName} onChange={(e) => handleParcelChange(index, e)} className="input" style={{ background: 'white' }} required />
                  </label>
                  <label className="label">
                    Crop
                    <input type="text" id={`parcel-${index}-crop`} name="crop" value={parcel.crop} onChange={(e) => handleParcelChange(index, e)} className="input" style={{ background: 'white' }} required />
                  </label>
                  <label className="label">
                    Planting Schedule
                    <input type="text" id={`parcel-${index}-plantingSchedule`} name="plantingSchedule" value={parcel.plantingSchedule} onChange={(e) => handleParcelChange(index, e)} className="input" style={{ background: 'white' }} required />
                  </label>
                  <label className="label">
                    Declared Size
                    <input type="number" id={`parcel-${index}-declaredSize`} step="0.01" min="0" name="declaredSize" value={parcel.declaredSize} onChange={(e) => handleParcelChange(index, e)} onBlur={(e) => handleParcelDecimalBlur(index, e)} className="input" style={{ background: 'white' }} required />
                  </label>
                  <label className="label">
                    Verified Size
                    <input type="number" id={`parcel-${index}-verifiedSize`} step="0.01" min="0" name="verifiedSize" value={parcel.verifiedSize} onChange={(e) => handleParcelChange(index, e)} onBlur={(e) => handleParcelDecimalBlur(index, e)} className="input" style={{ background: 'white' }} required />
                  </label>
                  <label className="label" style={{ gridColumn: '1 / -1' }}>
                    Remarks
                    <textarea id={`parcel-${index}-remarks`} name="remarks" value={parcel.remarks} onChange={(e) => handleParcelChange(index, e)} className="input" style={{ minHeight: '80px', resize: 'vertical', background: 'white' }} />
                  </label>
                </div>
              </div>
            ))}

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <button type="button" className="btn" style={{ background: 'transparent', color: 'var(--primary)', border: '2px dashed var(--primary)' }} onClick={addParcel}>+ Add Another Parcel</button>
            </div>

            <div className="actions" style={{ marginTop: '32px', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn" style={{ background: 'var(--muted)', color: 'var(--text)' }} onClick={() => setSelectedRecord(null)}>Cancel</button>
              <button type="submit" className="btn" disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Stub'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview Modal */}
      {previewImages && (
        <div className="result-modal" style={{ zIndex: 1050 }} role="dialog" aria-modal="true" onMouseDown={() => !isSending && setPreviewImages(null)}>
          <div className="result-card" style={{ maxWidth: '850px', padding: '32px', textAlign: 'center' }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.25rem' }}>Stub Preview</h3>
              <button type="button" className="result-close" onClick={() => setPreviewImages(null)} disabled={isSending}>×</button>
            </div>
            <div style={{ border: '1px solid var(--muted)', marginBottom: '24px' }}>
              <div style={{ background: '#f8fafc', padding: '8px', borderBottom: '1px solid var(--muted)', fontWeight: 'bold' }}>OCAS Copy (To be downloaded)</div>
              <img src={previewImages.ocas} alt="Generated OCAS Copy" style={{ width: '100%', display: 'block', borderBottom: '1px solid var(--muted)' }} />
              <div style={{ background: '#f8fafc', padding: '8px', borderBottom: '1px solid var(--muted)', fontWeight: 'bold' }}>Farmer's Copy (To be emailed)</div>
              <img src={previewImages.farmer} alt="Generated Farmer's Copy" style={{ width: '100%', display: 'block' }} />
            </div>
            <div className="actions" style={{ justifyContent: 'center', gap: '12px' }}>
              <button type="button" className="btn" style={{ background: 'var(--muted)', color: 'var(--text)', opacity: isSending ? 0.6 : 1, cursor: isSending ? 'not-allowed' : 'pointer' }} onClick={() => setPreviewImages(null)} disabled={isSending}>Back to Edit</button>
              <button type="button" className="btn" onClick={handleDownload} disabled={isSending}>
                {isSending ? 'Sending...' : 'Download and Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {notification && (
        <div className="result-modal" style={{ zIndex: 1100 }} role="dialog" aria-modal="true" onMouseDown={() => { if (notification.onClose) notification.onClose(); setNotification(null); }}>
          <div className="result-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
              {notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : '⚠️'}
            </div>
            <h3 style={{ margin: '0 0 12px 0', color: notification.type === 'error' ? '#b91c1c' : '#0f172a' }}>
              {notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Error' : 'Notice'}
            </h3>
            <p style={{ margin: '0 0 24px 0', color: '#334155' }}>{notification.message}</p>
            <button className="btn" style={{ width: '100%', background: notification.type === 'error' ? '#b91c1c' : 'var(--accent)' }} onClick={() => { if (notification.onClose) notification.onClose(); setNotification(null); }}>
              OK
            </button>
          </div>
        </div>
      )}
    </>
  )
}