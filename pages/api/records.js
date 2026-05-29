import { createClient } from '@libsql/client'

let client;

if (process.env.TURSO_DB_URL) {
  client = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_API_TOKEN
  })
}

export default async function handler(req, res) {
  if (!client) {
    return res.status(500).json({ error: 'Database environment variables are missing on the server.' })
  }

  // Simple Authentication Gate
  const authHeader = req.headers.authorization
  const expectedToken = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized access.' })
  }

  try {
    // GET: Fetch all records (latest 100 for admin view)
    if (req.method === 'GET') {
      const result = await client.execute('SELECT * FROM RSBSA ORDER BY id DESC LIMIT 100')
      return res.status(200).json({ rows: result.rows || [] })
    }

    // POST: Add a new record
    if (req.method === 'POST') {
      const isPreview = req.query.preview === 'true'

      if (Array.isArray(req.body)) {
        // Batch insert for CSV import
        const formatKey = (r) => [r.ref_no, r.first_name, r.middle_initial, r.last_name, r.barangay, r.crop, r.declared_size, r.verified_size].map(v => v || '').join('|')
        
        const existingRes = await client.execute('SELECT ref_no, first_name, middle_initial, last_name, barangay, crop, declared_size, verified_size FROM RSBSA')
        const seen = new Set(existingRes.rows.map(formatKey))
        
        if (isPreview) {
          const previewRecords = req.body.map(r => {
            const key = formatKey(r)
            const isDuplicate = seen.has(key)
            if (!isDuplicate) seen.add(key)
            return { ...r, _isDuplicate: isDuplicate }
          })
          return res.status(200).json({ previewRecords })
        }

        const uniqueRecords = []
        for (const r of req.body) {
          const key = formatKey(r)
          if (!seen.has(key)) {
            uniqueRecords.push(r)
            seen.add(key)
          }
        }
        
        if (uniqueRecords.length === 0) {
          return res.status(400).json({ error: 'All records in the CSV are duplicates and were ignored.' })
        }

        const statements = uniqueRecords.map(r => ({
          sql: `INSERT INTO RSBSA (ref_no, first_name, middle_initial, last_name, barangay, crop, planting_schedule, declared_size, verified_size, remarks, gpx_file_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [r.ref_no, r.first_name, r.middle_initial, r.last_name, r.barangay, r.crop, r.planting_schedule, r.declared_size, r.verified_size, r.remarks, r.gpx_file_name]
        }))
        await client.batch(statements, 'write')
        return res.status(201).json({ success: true, count: uniqueRecords.length, skipped: req.body.length - uniqueRecords.length })
      } else {
        // Single insert
        const { ref_no, first_name, middle_initial, last_name, barangay, crop, planting_schedule, declared_size, verified_size, remarks, gpx_file_name } = req.body
        
        // SQLite 'IS ?' is used instead of '=' to gracefully handle null/empty checks
        const checkSql = `SELECT id FROM RSBSA WHERE ref_no IS ? AND first_name IS ? AND middle_initial IS ? AND last_name IS ? AND barangay IS ? AND crop IS ? AND declared_size IS ? AND verified_size IS ?`
        const checkParams = [ref_no, first_name, middle_initial, last_name, barangay, crop, declared_size, verified_size]
        const existing = await client.execute({ sql: checkSql, args: checkParams })
        
        if (existing.rows.length > 0) {
          return res.status(400).json({ error: 'A duplicate record with the same details (Ref No, Name, Barangay, Crop, Sizes) already exists.' })
        }

        const sql = `INSERT INTO RSBSA (ref_no, first_name, middle_initial, last_name, barangay, crop, planting_schedule, declared_size, verified_size, remarks, gpx_file_name)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        const params = [ref_no, first_name, middle_initial, last_name, barangay, crop, planting_schedule, declared_size, verified_size, remarks, gpx_file_name]
        
        const result = await client.execute({ sql, args: params })
        return res.status(201).json({ success: true, id: result.lastInsertRowid })
      }
    }

    // PUT: Update an existing record
    if (req.method === 'PUT') {
      const { id, ref_no, first_name, middle_initial, last_name, barangay, crop, planting_schedule, declared_size, verified_size, remarks, gpx_file_name } = req.body
      if (!id) return res.status(400).json({ error: 'Record ID is required for updating.' })
      
      const sql = `UPDATE RSBSA SET ref_no = ?, first_name = ?, middle_initial = ?, last_name = ?, barangay = ?, crop = ?, planting_schedule = ?, declared_size = ?, verified_size = ?, remarks = ?, gpx_file_name = ? WHERE id = ?`
      const params = [ref_no, first_name, middle_initial, last_name, barangay, crop, planting_schedule, declared_size, verified_size, remarks, gpx_file_name, id]
      
      await client.execute({ sql, args: params })
      return res.status(200).json({ success: true })
    }

    // DELETE: Remove a record
    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) return res.status(400).json({ error: 'Record ID is required for deletion.' })
      
      await client.execute({ sql: 'DELETE FROM RSBSA WHERE id = ?', args: [id] })
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed.' })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}