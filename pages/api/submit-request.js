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

  const { firstName, middleInitial, lastName, suffix, email, contactNo, region, province, city, barangay } = req.body || {}

  if (!firstName || !middleInitial || !lastName || !email || !contactNo || !region || !province || !city || !barangay) {
    return res.status(400).json({ error: 'All fields (First Name, Middle Initial, Last Name, Email, Contact No., Region, Province, City, Barangay) are required.' })
  }

  if (!/^09\d{9}$/.test(contactNo)) {
    return res.status(400).json({ error: 'Invalid Philippine mobile number format. Must start with 09 and be 11 digits long.' })
  }

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT,
        middle_initial TEXT,
        last_name TEXT,
        suffix TEXT,
        email TEXT,
        contact_no TEXT,
        region TEXT,
        barangay TEXT,
        city TEXT,
        province TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Safely attempt to add new columns in case the table was created before they were introduced.
    const newColumns = ['email', 'contact_no', 'region', 'city', 'province', 'suffix'];
    for (const col of newColumns) {
      try {
        await client.execute(`ALTER TABLE Requests ADD COLUMN ${col} TEXT`);
      } catch (e) {
        // If the column already exists, this will throw an error which we can safely ignore.
      }
    }

    const sql = `INSERT INTO Requests (first_name, middle_initial, last_name, suffix, email, contact_no, region, barangay, city, province) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const params = [firstName, middleInitial, lastName, suffix, email, contactNo, region, barangay, city, province]
    const result = await client.execute(sql, params)
    return res.status(200).json({ success: true, message: 'Request submitted successfully.' })
  } catch (err) {
    // libsql client may include nested cause with HTTP status
    console.error('DB query error', err)
    const status = err?.cause?.status || err?.status || 500
    const message = err?.message || String(err)
    return res.status(status === 500 ? 500 : status).json({ error: message, status })
  }
}
