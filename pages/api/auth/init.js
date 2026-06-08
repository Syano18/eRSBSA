import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'

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

  // To prevent unauthorized re-initialization, we check if the request provides the .env.local password.
  // In a real production app, this endpoint should be removed after first use.
  const authHeader = req.headers.authorization
  const expectedToken = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized initialization attempt.' })
  }

  try {
    // 1. Create Admins table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS Admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 2. Check if an admin already exists
    const result = await client.execute('SELECT COUNT(*) as count FROM Admins')
    const count = result.rows[0].count

    if (count > 0) {
      return res.status(200).json({ message: 'Admins table already populated. Initialization skipped.' })
    }

    // 3. Insert default admin
    const defaultUsername = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin'
    const defaultPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(defaultPassword, saltRounds)

    await client.execute(
      'INSERT INTO Admins (username, password_hash) VALUES (?, ?)',
      [defaultUsername, passwordHash]
    )

    return res.status(200).json({ success: true, message: 'Database initialized and default admin created successfully.' })
  } catch (err) {
    console.error('Initialization error:', err)
    return res.status(500).json({ error: err.message || 'Internal Server Error' })
  }
}
