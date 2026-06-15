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

  // JWT Authentication Gate
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized access.' })
  }

  const token = authHeader.split(' ')[1]
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only-12345'
  
  try {
    const jwt = (await import('jsonwebtoken')).default
    jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }

  try {
    // GET: Fetch all records (latest 100 for admin view)
    if (req.method === 'GET') {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS Requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT,
          middle_initial TEXT,
          last_name TEXT,
          suffix TEXT,
          email TEXT,
          region TEXT,
          barangay TEXT,
          city TEXT,
          province TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Safely attempt to add new columns in case the table was created before they were introduced.
      const newColumns = ['email', 'region', 'city', 'province', 'suffix'];
      for (const col of newColumns) {
        try {
          await client.execute(`ALTER TABLE Requests ADD COLUMN ${col} TEXT`);
        } catch (e) {
          // If the column already exists, this will throw an error which we can safely ignore.
        }
      }

      const result = await client.execute('SELECT * FROM Requests ORDER BY id DESC LIMIT 100')
      return res.status(200).json({ rows: result.rows || [] })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id) {
        return res.status(400).json({ error: 'Record ID is required.' })
      }
      
      await client.execute('DELETE FROM Requests WHERE id = ?', [id])
      return res.status(200).json({ success: true, message: 'Record deleted successfully.' })
    }

    return res.status(405).json({ error: 'Method not allowed.' })
  } catch (err) {
    console.error('API Error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}