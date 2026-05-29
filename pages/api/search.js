import { createClient } from '@libsql/client'

let client;

if (process.env.TURSO_DB_URL) {
  client = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_API_TOKEN
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  if (!client) {
    return res.status(500).json({ error: 'Database environment variables are missing on the server.' })
  }

  const { firstName, middleInitial, lastName, barangay } = req.body || {}

  if (!firstName || !middleInitial || !lastName || !barangay) {
    return res.status(400).json({ error: 'All fields (First Name, Middle Initial, Last Name, Barangay) are required to perform a search.' })
  }

  const clauses = []
  const params = []

  if (firstName) { clauses.push("first_name = ?"); params.push(firstName) }
  if (middleInitial) { clauses.push("middle_initial = ?"); params.push(middleInitial) }
  if (lastName) { clauses.push("last_name = ?"); params.push(lastName) }
  if (barangay) { clauses.push("barangay = ?"); params.push(barangay) }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const sql = `SELECT id, ref_no, first_name, middle_initial, last_name, barangay, crop, declared_size, verified_size, remarks, created_at, updated_at FROM RSBSA ${where} ORDER BY id DESC LIMIT 200`

  try {
    const result = await client.execute(sql, params)
    // return raw rows and columns so the frontend can interpret
    return res.status(200).json({ rows: result.rows || [], columns: result.columns || [] })
  } catch (err) {
    // libsql client may include nested cause with HTTP status
    console.error('DB query error', err)
    const status = err?.cause?.status || err?.status || 500
    const message = err?.message || String(err)
    return res.status(status === 500 ? 500 : status).json({ error: message, status })
  }
}
