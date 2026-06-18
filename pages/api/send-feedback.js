import { createClient } from '@libsql/client'
import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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

  const { id, email, name, feedback } = req.body

  if (!id || !email || !feedback) {
    return res.status(400).json({ error: 'ID, email, and feedback are required.' })
  }

  try {
    const client = createClient({
      url: process.env.TURSO_DB_URL || 'file:./local.db',
      authToken: process.env.TURSO_API_TOKEN,
    })

    // Check if the request exists
    const result = await client.execute({
      sql: 'SELECT * FROM Requests WHERE id = ?',
      args: [id]
    })

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found in the database.' })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '"eRSBSA Admin" <noreply@ersbsa.gov.ph>',
      to: email,
      subject: `Feedback on your RSBSA Request`,
      text: `Good day ${name},\n\nRegarding your recent request:\n\n${feedback}\n\nThank you,\nOffice for the City Agricultural Services`,
    }

    // Send email
    await transporter.sendMail(mailOptions)

    // Delete request from database
    await client.execute({
      sql: 'DELETE FROM Requests WHERE id = ?',
      args: [id]
    })

    res.status(200).json({ success: true, message: 'Feedback sent and request deleted successfully.' })
  } catch (err) {
    console.error('Send feedback error:', err)
    res.status(500).json({ error: 'Failed to send feedback.' })
  }
}
