import { createClient } from '@libsql/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

let client;
if (process.env.TURSO_DB_URL) {
  client = createClient({
    url: process.env.TURSO_DB_URL,
    authToken: process.env.TURSO_API_TOKEN
  })
}

// Generate a random string to use as fallback if JWT_SECRET is missing.
// In production, JWT_SECRET should always be set in .env
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only-12345'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  if (!client) {
    return res.status(500).json({ error: 'Database environment variables are missing on the server.' })
  }

  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  try {
    const result = await client.execute('SELECT id, username, password_hash FROM Admins WHERE username = ?', [username])
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    const admin = result.rows[0]
    const isMatch = await bcrypt.compare(password, admin.password_hash)

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '8h' } // Token expires in 8 hours
    )

    return res.status(200).json({ success: true, token })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
