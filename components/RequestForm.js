import { useState, useRef, useEffect } from 'react'

export default function RequestForm({ onSearch }) {
  const [firstName, setFirstName] = useState('')
  const [middleInitial, setMiddleInitial] = useState('')
  const [lastName, setLastName] = useState('')
  const [suffix, setSuffix] = useState('')
  const [email, setEmail] = useState('')
  

  const [region, setRegion] = useState('')
  const [barangay, setBarangay] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')

  const [regionsData, setRegionsData] = useState([])
  const [provincesData, setProvincesData] = useState([])
  const [citiesData, setCitiesData] = useState([])
  const [barangaysData, setBarangaysData] = useState([])

  const [regionCode, setRegionCode] = useState('')
  const [provinceCode, setProvinceCode] = useState('')
  const [cityCode, setCityCode] = useState('')

  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const [showRegionDropdown, setShowRegionDropdown] = useState(false)
  const [regionHighlightIndex, setRegionHighlightIndex] = useState(-1)
  const regionWrapperRef = useRef(null)

  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false)
  const [provinceHighlightIndex, setProvinceHighlightIndex] = useState(-1)
  const provinceWrapperRef = useRef(null)

  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [cityHighlightIndex, setCityHighlightIndex] = useState(-1)
  const cityWrapperRef = useRef(null)

  const normalizeMiddleInitial = (value) => {
    let cleaned = value.trim().toUpperCase()
    if (!cleaned) return ''
    if (!cleaned.endsWith('.')) {
      cleaned += '.'
    }
    return cleaned
  }
  
  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/regions')
      .then(res => res.json())
      .then(data => {
        data.sort((a, b) => a.name.localeCompare(b.name))
        setRegionsData(data)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const reg = regionsData.find(r => r.name === region || r.regionName === region)
    if (reg) {
      if (reg.code !== regionCode) {
        setRegionCode(reg.code)
        fetch(`https://psgc.gitlab.io/api/regions/${reg.code}/provinces`)
          .then(res => res.json())
          .then(data => {
            if (data.length === 0) {
              setProvincesData([{ code: reg.code, name: reg.name }])
            } else {
              data.sort((a, b) => a.name.localeCompare(b.name))
              setProvincesData(data)
            }
          })
          .catch(console.error)
      }
    } else {
      setRegionCode('')
      setProvincesData([])
    }
  }, [region, regionsData, regionCode])

  useEffect(() => {
    const prov = provincesData.find(p => p.name === province)
    if (prov) {
      if (prov.code !== provinceCode) {
        setProvinceCode(prov.code)
        const url = prov.code === regionCode 
          ? `https://psgc.gitlab.io/api/regions/${prov.code}/cities-municipalities`
          : `https://psgc.gitlab.io/api/provinces/${prov.code}/cities-municipalities`
        
        fetch(url)
          .then(res => res.json())
          .then(data => {
             data.sort((a, b) => a.name.localeCompare(b.name))
             setCitiesData(data)
          })
          .catch(console.error)
      }
    } else {
      setProvinceCode('')
      setCitiesData([])
    }
  }, [province, provincesData, provinceCode, regionCode])

  useEffect(() => {
    const cit = citiesData.find(c => c.name === city)
    if (cit) {
      if (cit.code !== cityCode) {
        setCityCode(cit.code)
        fetch(`https://psgc.gitlab.io/api/cities-municipalities/${cit.code}/barangays`)
          .then(res => res.json())
          .then(data => {
             data.sort((a, b) => a.name.localeCompare(b.name))
             setBarangaysData(data)
          })
          .catch(console.error)
      }
    } else {
      setCityCode('')
      setBarangaysData([])
    }
  }, [city, citiesData, cityCode])

  const filteredRegions = regionsData.map(r => r.name).filter((r) => r.toLowerCase().includes((region || '').toLowerCase()))
  const filteredProvinces = provincesData.map(p => p.name).filter((p) => p.toLowerCase().includes((province || '').toLowerCase()))
  const filteredCities = citiesData.map(c => c.name).filter((c) => c.toLowerCase().includes((city || '').toLowerCase()))
  const filteredBarangays = barangaysData.map(b => b.name).filter((b) => b.toLowerCase().includes((barangay || '').toLowerCase()))

  const onInputChange = (val) => {
    setBarangay(val)
    setShowDropdown(true)
    setHighlightIndex(-1)
  }
  const onRegionInputChange = (val) => {
    setRegion(val)
    setShowRegionDropdown(true)
    setRegionHighlightIndex(-1)
  }
  const onProvinceInputChange = (val) => {
    setProvince(val)
    setShowProvinceDropdown(true)
    setProvinceHighlightIndex(-1)
  }
  const onCityInputChange = (val) => {
    setCity(val)
    setShowCityDropdown(true)
    setCityHighlightIndex(-1)
  }

  const onFirstNameFocus = () => { setFirstName('') }
  const onLastNameFocus = () => { setLastName('') }
  const onSuffixFocus = () => { setSuffix('') }
  const onEmailFocus = () => { setEmail('') }
  const onMiddleInitialFocus = () => { setMiddleInitial('') }
  const onBarangayFocus = () => { setBarangay(''); setShowDropdown(true) }
  const onRegionFocus = () => { setRegion(''); setShowRegionDropdown(true) }
  const onProvinceFocus = () => { setProvince(''); setShowProvinceDropdown(true) }
  const onCityFocus = () => { setCity(''); setShowCityDropdown(true) }
  const onMiddleInitialBlur = () => { setMiddleInitial(normalizeMiddleInitial(middleInitial)) }

  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleOutside = (e) => {
      if (showDropdown && wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
      if (showRegionDropdown && regionWrapperRef.current && !regionWrapperRef.current.contains(e.target)) {
        setShowRegionDropdown(false)
      }
      if (showProvinceDropdown && provinceWrapperRef.current && !provinceWrapperRef.current.contains(e.target)) {
        setShowProvinceDropdown(false)
      }
      if (showCityDropdown && cityWrapperRef.current && !cityWrapperRef.current.contains(e.target)) {
        setShowCityDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [showDropdown, showRegionDropdown, showProvinceDropdown, showCityDropdown])

  const selectBarangay = (val) => {
    setBarangay(val)
    setShowDropdown(false)
    setHighlightIndex(-1)
  }

  const selectRegion = (val) => {
    setRegion(val)
    setProvince('') // reset province when region changes
    setCity('')     // reset city when region changes
    setBarangay('') // reset barangay when region changes
    setShowRegionDropdown(false)
    setRegionHighlightIndex(-1)
  }

  const selectProvince = (val) => {
    setProvince(val)
    setCity('')     // reset city when province changes
    setBarangay('') // reset barangay when province changes
    setShowProvinceDropdown(false)
    setProvinceHighlightIndex(-1)
  }

  const selectCity = (val) => {
    setCity(val)
    setBarangay('') // reset barangay when city changes
    setShowCityDropdown(false)
    setCityHighlightIndex(-1)
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

  const handleRegionKeyDown = (e) => {
    if (!showRegionDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setRegionHighlightIndex((i) => Math.min(i + 1, filteredRegions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setRegionHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (regionHighlightIndex >= 0 && regionHighlightIndex < filteredRegions.length) {
        selectRegion(filteredRegions[regionHighlightIndex])
      }
    } else if (e.key === 'Escape') {
      setShowRegionDropdown(false)
    }
  }

  const handleProvinceKeyDown = (e) => {
    if (!showProvinceDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setProvinceHighlightIndex((i) => Math.min(i + 1, filteredProvinces.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setProvinceHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (provinceHighlightIndex >= 0 && provinceHighlightIndex < filteredProvinces.length) {
        selectProvince(filteredProvinces[provinceHighlightIndex])
      }
    } else if (e.key === 'Escape') {
      setShowProvinceDropdown(false)
    }
  }

  const handleCityKeyDown = (e) => {
    if (!showCityDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCityHighlightIndex((i) => Math.min(i + 1, filteredCities.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCityHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (cityHighlightIndex >= 0 && cityHighlightIndex < filteredCities.length) {
        selectCity(filteredCities[cityHighlightIndex])
      }
    } else if (e.key === 'Escape') {
      setShowCityDropdown(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    
    const payload = {
      firstName: firstName.trim().toUpperCase(),
      middleInitial: normalizeMiddleInitial(middleInitial),
      lastName: lastName.trim().toUpperCase(),
      suffix: suffix.trim().toUpperCase(),
      email: email.trim(),
      region: region.trim(),
      barangay: barangay.trim(),
      city: city.trim(),
      province: province.trim(),
    }

    if (!payload.firstName || !payload.middleInitial || !payload.lastName || !payload.email || !payload.region || !payload.province || !payload.city || !payload.barangay) {
      return alert('All fields are required. Please ensure no fields are left blank or contain only spaces.')
    }

    // Call the original search/save logic
    onSearch(payload)

    // Notify the admin via email
    fetch('/api/notify-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error('Failed to notify admin:', err))
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="panel">
        <h4 className="panel-title">Personal Information</h4>
        <div className="form-grid name-row">
          <label className="label">
            <span>First name<span style={{ color: 'red' }}>*</span></span>
            <input
              className="input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              onFocus={onFirstNameFocus}
              placeholder="Juan"
              required
            />
          </label>

          <label className="label">
            <span>M.I.<span style={{ color: 'red' }}>*</span></span>
            <input
              className="input"
              value={middleInitial}
              onChange={(e) => setMiddleInitial(e.target.value.replace(/[^a-zA-Z.]/g, ''))}
              onFocus={onMiddleInitialFocus}
              onBlur={onMiddleInitialBlur}
              placeholder="D."
              maxLength={10}
              required
            />
          </label>

          <label className="label">
            <span>Last name<span style={{ color: 'red' }}>*</span></span>
            <input
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onFocus={onLastNameFocus}
              placeholder="Dela Cruz"
              required
            />
          </label>

          <label className="label">
            <span>Suffix</span>
            <input
              className="input"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              onFocus={onSuffixFocus}
              placeholder="Jr., Sr., III"
            />
          </label>
        </div>
        
        <div className="form-grid" style={{ marginTop: '10px' }}>
          <label className="label">
            <span>Email Address<span style={{ color: 'red' }}>*</span></span>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={onEmailFocus}
              placeholder="juan@example.com"
              required
            />
          </label>
        </div>
      </div>

      <div className="panel">
        <h4 className="panel-title">Farm Location Address</h4>
        <div className="form-grid address-row">
          <label className="label">
            <span>Region<span style={{ color: 'red' }}>*</span></span>
            <div className="select-wrapper" ref={regionWrapperRef}>
              <input
                className="input"
                value={region}
                onChange={(e) => onRegionInputChange(e.target.value)}
                onFocus={onRegionFocus}
                onKeyDown={handleRegionKeyDown}
                placeholder="Select region"
                required
                aria-autocomplete="list"
                aria-haspopup="true"
              />
              {showRegionDropdown && (
                <ul className="dropdown-list" role="listbox">
                  {filteredRegions.length === 0 && <li className="dropdown-item">No results</li>}
                  {filteredRegions.map((r, idx) => (
                    <li
                      key={r}
                      role="option"
                      aria-selected={regionHighlightIndex === idx}
                      className={`dropdown-item ${regionHighlightIndex === idx ? 'highlight' : ''}`}
                      onMouseDown={(ev) => { ev.preventDefault(); selectRegion(r) }}
                      onMouseEnter={() => setRegionHighlightIndex(idx)}
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>

          <label className="label">
            <span>Province<span style={{ color: 'red' }}>*</span></span>
            <div className="select-wrapper" ref={provinceWrapperRef}>
              <input
                className="input"
                value={province}
                onChange={(e) => onProvinceInputChange(e.target.value)}
                onFocus={onProvinceFocus}
                onKeyDown={handleProvinceKeyDown}
                placeholder={region ? "Select province" : "Select a region first"}
                required
                disabled={!region}
                aria-autocomplete="list"
                aria-haspopup="true"
              />
              {showProvinceDropdown && (
                <ul className="dropdown-list" role="listbox">
                  {filteredProvinces.length === 0 && <li className="dropdown-item">No results</li>}
                  {filteredProvinces.map((p, idx) => (
                    <li
                      key={p}
                      role="option"
                      aria-selected={provinceHighlightIndex === idx}
                      className={`dropdown-item ${provinceHighlightIndex === idx ? 'highlight' : ''}`}
                      onMouseDown={(ev) => { ev.preventDefault(); selectProvince(p) }}
                      onMouseEnter={() => setProvinceHighlightIndex(idx)}
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>

          <label className="label">
            <span>City / Municipality<span style={{ color: 'red' }}>*</span></span>
            <div className="select-wrapper" ref={cityWrapperRef}>
              <input
                className="input"
                value={city}
                onChange={(e) => onCityInputChange(e.target.value)}
                onFocus={onCityFocus}
                onKeyDown={handleCityKeyDown}
                placeholder={province ? "Select city / municipality" : "Select a province first"}
                required
                disabled={!province}
                aria-autocomplete="list"
                aria-haspopup="true"
              />
              {showCityDropdown && (
                <ul className="dropdown-list" role="listbox">
                  {filteredCities.length === 0 && <li className="dropdown-item">No results</li>}
                  {filteredCities.map((c, idx) => (
                    <li
                      key={c}
                      role="option"
                      aria-selected={cityHighlightIndex === idx}
                      className={`dropdown-item ${cityHighlightIndex === idx ? 'highlight' : ''}`}
                      onMouseDown={(ev) => { ev.preventDefault(); selectCity(c) }}
                      onMouseEnter={() => setCityHighlightIndex(idx)}
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>

          <label className="label">
            <span>Barangay<span style={{ color: 'red' }}>*</span></span>
            <div className="select-wrapper" ref={wrapperRef}>
              <input
                className="input"
                value={barangay}
                onChange={(e) => onInputChange(e.target.value)}
                onFocus={onBarangayFocus}
                onKeyDown={handleKeyDown}
                placeholder={city ? "Select barangay" : "Select a city / municipality first"}
                required
                disabled={!city}
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
        </div>
      </div>

      <div className="actions">
        <button className="btn" type="submit">Submit Request</button>
      </div>
    </form>
  )
}
