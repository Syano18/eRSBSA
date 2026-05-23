import { useState, useRef, useEffect } from 'react'

export default function SearchForm({ onSearch }) {
  const [firstName, setFirstName] = useState('')
  const [middleInitial, setMiddleInitial] = useState('')
  const [lastName, setLastName] = useState('')
  

  const [barangay, setBarangay] = useState('')
  const [city, setCity] = useState('City of Tabuk')
  const [province, setProvince] = useState('Kalinga')

  const barangays = [
    'Agbannawag','Amlao','Appas','Bado Dangwa','Bagumbayan','Balawag','Balong','Bantay','Bulanao Centro','Bulanao Norte','Bulo','Cabaritan','Cabaruan','Calaccad','Calanan','Casigayan','Cudal','Dagupan Centro','Dagupan Weste','Dilag','Dupag','Gobgob','Guilayon','Ipil','Lacnog','Lacnog West','Lanna','Laya East','Laya West','Lucog','Magnao','Magsaysay','Malalao','Malin-awa','Masablang','Nambaran','Nambucayan','Naneng','New Tanglag','San Juan','San Julian','Suyang','Tuga'
  ]

  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const normalizeMiddleInitial = (value) => {
    const cleaned = value.replace(/[^a-zA-Z]/g, '').trim()
    if (!cleaned) return ''
    return `${cleaned.toUpperCase()}.`
  }
  

  const filtered = barangays.filter((b) => b.toLowerCase().includes((barangay || '').toLowerCase()))

  const onInputChange = (val) => {
    setBarangay(val)
    setShowDropdown(true)
    setHighlightIndex(-1)
  }
  const onFirstNameFocus = () => { setFirstName('') }
  const onLastNameFocus = () => { setLastName('') }
  const onMiddleInitialFocus = () => { setMiddleInitial('') }
  const onBarangayFocus = () => { setBarangay(''); setShowDropdown(true) }
  const onMiddleInitialBlur = () => { setMiddleInitial(normalizeMiddleInitial(middleInitial)) }

  const wrapperRef = useRef(null)

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

  const selectBarangay = (val) => {
    setBarangay(val)
    setShowDropdown(false)
    setHighlightIndex(-1)
  }

  const handleKeyDown = (e) => {
    if (!showDropdown) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0 && highlightIndex < filtered.length) {
        selectBarangay(filtered[highlightIndex])
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    onSearch({
      firstName: firstName.trim(),
      middleInitial: normalizeMiddleInitial(middleInitial),
      lastName: lastName.trim(),
      barangay: barangay.trim(),
      city: city.trim(),
      province: province.trim(),
    })
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="panel">
        <h4 className="panel-title">Personal Information</h4>
        <div className="form-grid name-row">
          <label className="label">
            First name
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
            M.I.
            <input
              className="input"
              value={middleInitial}
              onChange={(e) => setMiddleInitial(e.target.value.replace(/[^a-zA-Z.]/g, ''))}
              onFocus={onMiddleInitialFocus}
              onBlur={onMiddleInitialBlur}
              placeholder="D."
              maxLength={10}
            />
          </label>

          <label className="label">
            Last name
            <input
              className="input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              onFocus={onLastNameFocus}
              placeholder="Dela Cruz"
              required
            />
          </label>
        </div>
      </div>

      <div className="panel">
        <h4 className="panel-title">Farm Location Address</h4>
        <div className="form-grid address-row">
          <label className="label">
            Barangay
            <div className="select-wrapper" ref={wrapperRef}>
              <input
                className="input"
                value={barangay}
                onChange={(e) => onInputChange(e.target.value)}
                onFocus={onBarangayFocus}
                onKeyDown={handleKeyDown}
                placeholder="Select barangay"
                required
                aria-autocomplete="list"
                aria-haspopup="true"
              />

              {showDropdown && (
                <ul className="dropdown-list" role="listbox">
                  {filtered.length === 0 && <li className="dropdown-item">No results</li>}
                  {filtered.map((b, idx) => (
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

          <label className="label">
            City / Municipality
            <input
              className="input"
              value={city}
              readOnly
            />
          </label>

          <label className="label">
            Province
            <input
              className="input"
              value={province}
              readOnly
            />
          </label>
        </div>
      </div>

      <div className="actions">
        <button className="btn" type="submit">Search</button>
      </div>
    </form>
  )
}
